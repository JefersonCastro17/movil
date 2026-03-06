import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../lib/storage/keys";

const AuthContext = createContext(null);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider.");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    isLoading: true
  });

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const [storedUser, storedToken] = await AsyncStorage.multiGet([
          STORAGE_KEYS.user,
          STORAGE_KEYS.token
        ]);

        const rawUser = storedUser?.[1];
        const token = storedToken?.[1];
        let user = null;

        if (rawUser) {
          try {
            user = JSON.parse(rawUser);
          } catch {
            user = null;
          }
        }

        if (user && token) {
          setAuthState({ user, token, isLoading: false });
          return;
        }
      } catch {
        setAuthState({ user: null, token: null, isLoading: false });
        return;
      }

      setAuthState({ user: null, token: null, isLoading: false });
    };

    hydrateAuth();
  }, []);

  const login = async (userData, authToken) => {
    if (!userData || !authToken) {
      await logout();
      return;
    }

    setAuthState({ user: userData, token: authToken, isLoading: false });
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.user, JSON.stringify(userData)],
      [STORAGE_KEYS.token, authToken]
    ]);
  };

  const logout = async () => {
    setAuthState((prev) => ({ ...prev, user: null, token: null, isLoading: false }));
    await AsyncStorage.multiRemove([STORAGE_KEYS.user, STORAGE_KEYS.token, STORAGE_KEYS.cart]);
  };

  const value = useMemo(() => {
    const user = authState.user;
    const token = authState.token;

    return {
      user,
      token,
      isLoading: authState.isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      getUserId: () => (user ? user.id_usuario || user.id || null : null),
      getUserEmail: () => (user ? user.email : "Anonimo"),
      getUserName: () => {
        if (!user) return "Anonimo";
        const nombre = user.nombre || "";
        const apellido = user.apellido || "";
        return `${nombre} ${apellido}`.trim() || "Anonimo";
      }
    };
  }, [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
