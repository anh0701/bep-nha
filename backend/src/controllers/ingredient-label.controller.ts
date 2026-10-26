import type { Request, Response } from "express";
import { ResolveIngredientLabelsRequest } from "../models/ingredient-label.model.js";
import { IngredientLabelService } from "../services/ingredient-label.service.js";

const ingredientLabelService = new IngredientLabelService();

export class IngredientLabelController {
  async resolveLabels(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const body = req.body as ResolveIngredientLabelsRequest;

      const data = await ingredientLabelService.resolveLabels(body);

      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Lỗi kiểm tra dữ liệu đầu vào
        const isValidationError =
          error.message.includes("labels") ||
          error.message.includes("model_name") ||
          error.message.includes("ký tự");

        if (isValidationError) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      console.error("Resolve ingredient labels error:", error);

      res.status(500).json({
        success: false,
        message: "Không thể ánh xạ label nguyên liệu.",
      });
    }
  }
}
