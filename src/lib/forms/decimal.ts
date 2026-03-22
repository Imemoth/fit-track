export function sanitizeDecimalInput(value: string, maxDecimals = 2) {
  const normalized = value.replace(",", ".");
  const cleaned = normalized.replace(/[^\d.]/g, "");

  if (!cleaned) {
    return "";
  }

  const [rawIntegerPart, ...rawDecimalParts] = cleaned.split(".");
  const integerPart = rawIntegerPart ?? "";
  const decimalPart = rawDecimalParts.join("").slice(0, maxDecimals);

  if (normalized.endsWith(".") && rawDecimalParts.length > 0 && decimalPart.length === 0) {
    return `${integerPart}.`;
  }

  return decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
}

export function parseLocalizedDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

export function toLocalizedDecimalDisplay(value: number | null | undefined, maxDecimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value) ? value.toString() : value.toFixed(maxDecimals);
}
