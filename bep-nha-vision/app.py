
from pathlib import Path
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Bep Nha AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).parent / "models" / "best.pt"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Không tìm thấy model: {MODEL_PATH}")

# Chỉ nạp model một lần khi khởi động service
model = YOLO(str(MODEL_PATH))


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_PATH.name,
        "classes": model.names,
    }


@app.post("/api/recognize")
async def recognize_ingredients(
    file: UploadFile = File(...)
):
    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng tải ảnh JPG, PNG hoặc WebP."
        )

    content = await file.read()

    # Giới hạn kích thước ảnh đầu vào: 10 MB
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Ảnh không được vượt quá 10 MB."
        )

    try:
        image = Image.open(BytesIO(content)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="File ảnh không hợp lệ."
        )

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25,
        verbose=False,
    )

    result = results[0]
    detections = []

    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls.item())
            confidence = float(box.conf.item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "class_id": class_id,
                "name": result.names[class_id],
                "confidence": round(confidence, 4),
                "box": {
                    "x1": round(x1, 1),
                    "y1": round(y1, 1),
                    "x2": round(x2, 1),
                    "y2": round(y2, 1),
                },
            })

    return {
        "image": {
            "width": image.width,
            "height": image.height,
        },
        "count": len(detections),
        "detections": detections,
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=False
    )