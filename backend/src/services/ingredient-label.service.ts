import { ResolvedIngredientLabel, ResolveIngredientLabelsRequest } from "../models/ingredient-label.model.js";
import { IngredientLabelRepository } from "../repositories/ingredient-label.repository.js";

const DEFAULT_MODEL_NAME = "bep-nha-ingredients";
const MAX_LABELS_PER_REQUEST = 100;

export class IngredientLabelService {
  constructor(
    private readonly repository = new IngredientLabelRepository()
  ) {}

  async resolveLabels(
    input: ResolveIngredientLabelsRequest
  ): Promise<ResolvedIngredientLabel[]> {
    if (!Array.isArray(input.labels)) {
      throw new Error("labels phải là một mảng.");
    }

    if (input.labels.length > MAX_LABELS_PER_REQUEST) {
      throw new Error(
        `Chỉ được gửi tối đa ${MAX_LABELS_PER_REQUEST} labels mỗi lần.`
      );
    }

    const labels = input.labels.map((label) => {
      if (typeof label !== "string" || !label.trim()) {
        throw new Error("Mỗi label phải là chuỗi không rỗng.");
      }

      return label.trim();
    });

    const modelName =
      typeof input.model_name === "string"
        ? input.model_name.trim()
        : DEFAULT_MODEL_NAME;

    if (!modelName) {
      throw new Error("model_name không được để trống.");
    }

    if (modelName.length > 150) {
      throw new Error("model_name không được dài quá 150 ký tự.");
    }

    // Không cần truy vấn database nếu không có label.
    if (labels.length === 0) {
      return [];
    }

    return this.repository.resolveLabels(labels, modelName);
  }
}
