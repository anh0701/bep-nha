export interface ResolvedIngredientLabel {
  label: string
  ingredient_id: number | null
  ingredient_name: string | null
  matched: boolean
}

interface ResolveResponse {
  success: boolean
  count: number
  data: ResolvedIngredientLabel[]
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export async function resolveIngredientLabels(
  labels: string[],
): Promise<ResolvedIngredientLabel[]> {
  const uniqueLabels = [...new Set(
    labels.map((label) => label.trim()).filter(Boolean),
  )]

  if (uniqueLabels.length === 0) return []

  let response: Response

  try {
    response = await fetch(
      `${API_BASE_URL}/ingredient-labels/resolve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: 'bep-nha-ingredients',
          labels: uniqueLabels,
        }),
      },
    )
  } catch {
    throw new Error(
      'Không thể kết nối backend để chuyển label thành tên tiếng Việt.',
    )
  }

  const result = (await response.json().catch(() => null)) as
    | ResolveResponse
    | null

  if (!response.ok || !result?.success || !Array.isArray(result.data)) {
    throw new Error(
      'API ánh xạ label nguyên liệu trả về dữ liệu không hợp lệ.',
    )
  }

  return result.data
}