export interface ResolveIngredientLabelsRequest {
  labels: string[];
  model_name?: string;
}

export interface ResolvedIngredientLabel {
  label: string;
  ingredient_id: number | null;
  ingredient_name: string | null;
  matched: boolean;
}
