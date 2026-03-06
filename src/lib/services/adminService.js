import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

export async function getAdminUsers() {
  const response = await httpRequest(API_ENDPOINTS.admin.users, { auth: true });
  return response?.usuarios || [];
}

export async function createAdminUser(payload) {
  return httpRequest(API_ENDPOINTS.admin.users, {
    method: "POST",
    data: payload,
    auth: true
  });
}

export async function updateAdminUser(id, payload) {
  return httpRequest(`${API_ENDPOINTS.admin.users}/${id}`, {
    method: "PUT",
    data: payload,
    auth: true
  });
}

export async function deleteAdminUser(id) {
  return httpRequest(`${API_ENDPOINTS.admin.users}/${id}`, {
    method: "DELETE",
    auth: true
  });
}

export async function getCrudProducts() {
  const response = await httpRequest(API_ENDPOINTS.products.crud, { auth: true });
  return Array.isArray(response) ? response : [];
}

export async function createCrudProduct(payload) {
  return httpRequest(API_ENDPOINTS.products.crud, {
    method: "POST",
    data: payload,
    auth: true
  });
}

export async function updateCrudProduct(id, payload) {
  return httpRequest(`${API_ENDPOINTS.products.crud}/${id}`, {
    method: "PUT",
    data: payload,
    auth: true
  });
}

export async function deleteCrudProduct(id) {
  return httpRequest(`${API_ENDPOINTS.products.crud}/${id}`, {
    method: "DELETE",
    auth: true
  });
}
