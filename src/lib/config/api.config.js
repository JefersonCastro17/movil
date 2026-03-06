export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    verifyEmail: "/api/auth/verify-email",
    resendVerification: "/api/auth/resend-verification",
    requestPasswordReset: "/api/auth/request-password-reset",
    resetPassword: "/api/auth/reset-password"
  },
  admin: {
    users: "/api/admin/users"
  },
  products: {
    crud: "/api/productos"
  },
  sales: {
    base: "/api/sales",
    reports: "/api/sales/reports"
  },
  movements: {
    base: "/api/movimientos"
  }
};
