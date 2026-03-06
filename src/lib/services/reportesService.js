import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";
import { formatPrice } from "./productService";

const REPORTS_BASE = `${API_ENDPOINTS.sales.base}/reports`;

function toQueryString(params) {
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);

  return pairs.length ? `?${pairs.join("&")}` : "";
}

export async function getVentasMes(inicio, fin) {
  const query = toQueryString({ inicio, fin });
  const response = await httpRequest(`${REPORTS_BASE}/ventas-mes${query}`, {
    auth: true
  });
  return response?.data || response || [];
}

export async function getTopProductos() {
  const response = await httpRequest(`${REPORTS_BASE}/top-productos`, {
    auth: true
  });
  return response?.data || response || [];
}

export async function getResumen() {
  const response = await httpRequest(`${REPORTS_BASE}/resumen`, {
    auth: true
  });
  return response?.data || response || {};
}

export async function getResumenMes() {
  const response = await httpRequest(`${REPORTS_BASE}/resumen-mes`, {
    auth: true
  });
  return response?.data || response || [];
}

export { formatPrice };
