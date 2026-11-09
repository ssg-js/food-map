import { Platform } from "react-native";
import { createRegistrationApi } from "@food-map/registration";
const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
export const apiBaseUrl =
  configured ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:3000"
    : "http://127.0.0.1:3000");
export const api = createRegistrationApi(apiBaseUrl);
