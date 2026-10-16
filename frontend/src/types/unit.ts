export type UnitType = 'mass' | 'volume' | 'count' | 'package'

export interface Unit {
  id: string
  name: string
  symbol: string
  unit_type: UnitType
}

export interface UnitListResponse {
  data: Unit[]
}
