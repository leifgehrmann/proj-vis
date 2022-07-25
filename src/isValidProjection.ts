import proj4 from "proj4";

export function isValidProjection(projection: string): boolean {
  try {
    const transformer = proj4(projection)
    transformer.forward([0, 0])
    return true
  } catch (e) {
    return false
  }
}
