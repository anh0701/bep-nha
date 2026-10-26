from pathlib import Path
from ultralytics import YOLO

MODEL_NAME = "models/yolov8n.pt"
CONFIDENCE = 0.35


def main():
    image_path = input("Nhập đường dẫn ảnh: ").strip()
    image_path = Path(image_path).expanduser()

    if not image_path.is_file():
        print("Không tìm thấy ảnh.")
        return

    # Tải mô hình pretrained ở lần chạy đầu tiên.
    model = YOLO(MODEL_NAME)

    results = model.predict(
        source=str(image_path),
        conf=CONFIDENCE,
        imgsz=640,
        device="cpu",
        verbose=False,
    )

    result = results[0]

    if result.boxes is None or len(result.boxes) == 0:
        print("Không phát hiện được vật thể nào.")
    else:
        print("\nCác vật thể phát hiện được:")

        for box in result.boxes:
            class_id = int(box.cls.item())
            confidence = float(box.conf.item())
            name = result.names[class_id]

            print(f"- {name}: {confidence:.1%}")

    # Lưu ảnh có khung nhận diện để kiểm tra trực quan.
    output_path = image_path.with_name(
        f"{image_path.stem}_result.jpg"
    )
    result.save(filename=str(output_path))
    print(f"\nẢnh kết quả: {output_path}")

    print("\nCác lớp thực phẩm mô hình hỗ trợ:")
    
    for class_id, name in model.names.items():
        if name in {
            "banana",
            "apple",
            "carrot",
            "broccoli",
            "orange",
            "sandwich",
            "pizza",
            "hot dog",
            "cake",
        }:
            print(f"- {class_id}: {name}")


if __name__ == "__main__":
    main()