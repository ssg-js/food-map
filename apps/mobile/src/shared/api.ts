import { Platform } from "react-native";
import { createRegistrationApi } from "@food-map/registration";
import { resolveApiOrigin } from "./api-origin";
export const apiBaseUrl = resolveApiOrigin(
  process.env.EXPO_PUBLIC_API_URL,
  Platform.OS,
  __DEV__,
  process.env.EXPO_PUBLIC_LOCAL_QA === "true",
);
export const api = createRegistrationApi(apiBaseUrl);
