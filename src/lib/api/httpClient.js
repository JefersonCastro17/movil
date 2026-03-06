import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/env";
import { STORAGE_KEYS } from "../storage/keys";

function normalizePath(path = "") {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;
  if (typeof payload === "string") return payload || fallbackMessage;
  return payload.message || payload.error || payload.details || fallbackMessage;
}

async function getStoredToken() {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
    return token || null;
  } catch {
    return null;
  }
}

export function buildApiUrl(path = "") {
  return `${API_URL}${normalizePath(path)}`;
}

export async function httpRequest(path, options = {}) {
  const {
    method = "GET",
    data,
    headers = {},
    auth = false,
    token,
    responseType = "json"
  } = options;

  const upperMethod = method.toUpperCase();
  const allowBody = upperMethod !== "GET" && upperMethod !== "HEAD";
  const requestHeaders = { ...headers };
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const hasBody = allowBody && data !== undefined && data !== null;

  if (auth) {
    const authToken = token || (await getStoredToken());
    if (authToken) {
      requestHeaders.Authorization = `Bearer ${authToken}`;
    }
  }

  if (hasBody && !isFormData && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const requestUrl = buildApiUrl(path);
  let response;

  try {
    response = await fetch(requestUrl, {
      method: upperMethod,
      headers: requestHeaders,
      body: hasBody ? (isFormData ? data : JSON.stringify(data)) : undefined
    });
  } catch (networkError) {
    const error = new Error(
      `No se pudo conectar con la API (${requestUrl}). Verifica red local, firewall y URL.`
    );
    error.status = 0;
    error.cause = networkError;
    throw error;
  }

  if (responseType === "blob") {
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.arrayBuffer();
  }

  const contentType = response.headers.get("content-type") || "";
  const text = response.status === 204 ? "" : await response.text();

  let payload = null;
  if (text) {
    if (contentType.includes("application/json")) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    } else {
      payload = text;
    }
  }

  if (!response.ok) {
    const error = new Error(extractErrorMessage(payload, `HTTP ${response.status}`));
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}
