import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

const SALES_BASE = API_ENDPOINTS.sales.base;

function toQueryString(params) {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

  return pairs.length ? `?${pairs.join("&")}` : "";
}

export function formatPrice(price) {
  if (typeof price !== "number" || Number.isNaN(price)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

export async function authorizedSalesFetch(endpoint, method = "GET", data = null) {
  return httpRequest(`${SALES_BASE}${endpoint}`, {
    method,
    data,
    auth: true
  });
}

export async function getProducts(filters = {}) {
  const query = toQueryString({
    search: filters.nombre || "",
    category: filters.categoria && filters.categoria !== "todas" ? filters.categoria : "",
    precioMin: filters.precioMin || "",
    precioMax: filters.precioMax || ""
  });

  const response = await authorizedSalesFetch(`/products${query}`);
  return response?.products || response?.data || response || [];
}

export async function getCategories() {
  const response = await authorizedSalesFetch("/categories");
  return response?.categories || response?.data || response || [];
}

export async function sendOrder(orderData) {
  const sanitized = {
    ...orderData,
    total: Number(orderData.total || 0)
  };

  return authorizedSalesFetch("/orders", "POST", sanitized);
}
