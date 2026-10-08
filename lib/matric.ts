/** YABATECH matric format: F/HD/24/3211001 (F, D or P; ND or HD). */
export const MATRIC_NUMBER_PATTERN = /^[FDP]\/(?:ND|HD)\/\d{2}\/\d{7}$/i;

export function normalizeMatricNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function isMatricNumber(value: string): boolean {
  return MATRIC_NUMBER_PATTERN.test(normalizeMatricNumber(value));
}
