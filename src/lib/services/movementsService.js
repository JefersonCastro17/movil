import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

const MOVEMENTS_BASE = API_ENDPOINTS.movements.base;

export async function getMovementProducts() {
  const response = await httpRequest(`${MOVEMENTS_BASE}/productos`, { auth: true });
  return Array.isArray(response) ? response : [];
}

export function registerMovement(payload) {
  return httpRequest(`${MOVEMENTS_BASE}/registrar`, {
    method: "POST",
    data: payload,
    auth: true
  });
}
