
export interface IngredientDetection {
  class_id: number;
  name: string;
  confidence: number;
  box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export interface IngredientRecognitionResponse {
  image: {
    width: number;
    height: number;
  };
  count: number;
  detections: IngredientDetection[];
}
