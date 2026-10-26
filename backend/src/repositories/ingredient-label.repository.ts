import { pool } from "../db/pool.js";
import { ResolvedIngredientLabel } from "../models/ingredient-label.model.js";


interface ResolveRow {
  label: string;
  ingredient_id: number | null;
  ingredient_name: string | null;
}

export class IngredientLabelRepository {
  async resolveLabels(
    labels: string[],
    modelName: string
  ): Promise<ResolvedIngredientLabel[]> {
    const sql = `
      SELECT
        requested.label,
        i.id AS ingredient_id,
        i.name AS ingredient_name
      FROM unnest($1::text[]) AS requested(label)
      LEFT JOIN ai_ingredient_labels AS ail
        ON LOWER(ail.label) = LOWER(requested.label)
        AND ail.model_name = $2
        AND ail.is_active = TRUE
      LEFT JOIN ingredients AS i
        ON i.id = ail.ingredient_id
        AND i.is_active = TRUE
      ORDER BY array_position($1::text[], requested.label);
    `;

    const result = await pool.query<ResolveRow>(sql, [
      labels,
      modelName,
    ]);

    return result.rows.map((row) => ({
      label: row.label,
      ingredient_id: row.ingredient_id,
      ingredient_name: row.ingredient_name,
      matched:
        row.ingredient_id !== null &&
        row.ingredient_name !== null,
    }));
  }
}
