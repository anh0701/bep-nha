import { findAllUnits } from '../repositories/unit.repository.js'

export async function getAllUnits() {
    return findAllUnits()
}