import { Platform } from "react-native";
import Constants from "expo-constants";

function getDevHostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    "";

  if (!hostUri) return null;

  const [host] = hostUri.split(":");
  if (!host) return null;

  return host;
}

function getDefaultApiUrl() {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
}

function resolveApiUrl() {
  const configured = (process.env.EXPO_PUBLIC_API_URL || "").trim();
  let candidate = configured || getDefaultApiUrl();

  const host = getDevHostFromExpo();
  const isLocalhostTarget = /https?:\/\/(localhost|127\.0\.0\.1)/i.test(candidate);
  const hasRealLanHost = host && host !== "localhost" && host !== "127.0.0.1";

  if (isLocalhostTarget && hasRealLanHost) {
    candidate = candidate.replace(/localhost|127\.0\.0\.1/i, host);
  }

  return candidate.replace(/\/+$/, "");
}

export const API_URL = resolveApiUrl();
