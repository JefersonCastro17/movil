import { API_URL } from "../config/env";

export const FALLBACK_IMAGE = "https://placehold.co/300x300/png?text=Mercapleno";

export function resolveImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== "string") return FALLBACK_IMAGE;

  const trimmed = imagePath.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  if (normalized.startsWith("/")) {
    return `${API_URL}${normalized}`;
  }

  const cleaned = normalized.replace(/^\.?\//, "");
  if (cleaned.includes("/")) {
    return `${API_URL}/${cleaned}`;
  }

  return `${API_URL}/images/productos/${cleaned}`;
}
