import { httpRequest } from "../api/httpClient";
import { API_ENDPOINTS } from "../config/api.config";

export function loginRequest(payload) {
  return httpRequest(API_ENDPOINTS.auth.login, {
    method: "POST",
    data: payload
  });
}

export function registerRequest(payload) {
  return httpRequest(API_ENDPOINTS.auth.register, {
    method: "POST",
    data: payload
  });
}

export function verifyEmailRequest(payload) {
  return httpRequest(API_ENDPOINTS.auth.verifyEmail, {
    method: "POST",
    data: payload
  });
}

export function resendVerificationRequest(payload) {
  return httpRequest(API_ENDPOINTS.auth.resendVerification, {
    method: "POST",
    data: payload
  });
}

export function requestPasswordReset(payload) {
  return httpRequest(API_ENDPOINTS.auth.requestPasswordReset, {
    method: "POST",
    data: payload
  });
}

export function resetPasswordRequest(payload) {
  return httpRequest(API_ENDPOINTS.auth.resetPassword, {
    method: "POST",
    data: payload
  });
}
