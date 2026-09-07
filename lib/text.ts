/**
 * Strips LinkedIn's "mathematical alphanumeric symbol" bold/italic Unicode
 * noise (people paste fake-bold/italic Unicode lookalikes instead of real
 * formatting) by decomposing to NFKD and dropping combining marks. Also
 * strips legitimate accents from non-English text (e.g. "café" -> "cafe")
 * as a side effect — an accepted tradeoff of this normalization approach,
 * not a bug.
 */
export function normalizeText(rawText: string): string {
  return rawText.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}
