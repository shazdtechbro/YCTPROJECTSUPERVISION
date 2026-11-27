export const PDF_COLOURS = ["yellow", "green", "blue", "pink"] as const;
export type PdfColour = (typeof PDF_COLOURS)[number];

export interface PdfMark {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  colour: PdfColour;
}

export function isPdfMark(value: unknown): value is PdfMark {
  if (!value || typeof value !== "object") return false;
  const { page, x, y, width, height, colour } = value as PdfMark;
  return Number.isInteger(page) && page >= 1 && page <= 10000 &&
    [x,y,width,height].every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1) &&
    width > 0 && height > 0 && x + width <= 1.000001 && y + height <= 1.000001 &&
    PDF_COLOURS.includes(colour);
}
