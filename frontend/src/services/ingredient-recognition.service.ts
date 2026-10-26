
import type {
  IngredientRecognitionResponse,
} from "../types/ingredient-recognition";

const AI_API_URL = import.meta.env.VITE_API_VISION_URL;

export async function recognizeIngredients(
  file: File
): Promise<IngredientRecognitionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(
      `${AI_API_URL}/api/recognize`,
      {
        method: "POST",
        body: formData,
      }
    );
  } catch {
    throw new Error(
      "Không thể kết nối AI service. Hãy kiểm tra server Python."
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : "Không thể nhận diện ảnh.";

    throw new Error(message);
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("detections" in data) ||
    !Array.isArray(data.detections) ||
    !("count" in data) ||
    !("image" in data)
  ) {
    throw new Error("Dữ liệu trả về từ AI API không hợp lệ.");
  }

  return data as IngredientRecognitionResponse;
}
