import { Router } from "express";
import { IngredientLabelController } from "../controllers/ingredient-label.controller.js";

const router = Router();
const controller = new IngredientLabelController();

router.post("/resolve", (req, res) => {
  void controller.resolveLabels(req, res);
});

export default router;
