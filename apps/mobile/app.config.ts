import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const androidKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY;
  return {
    ...config,
    name: "맛집지도",
    slug: "food-map-mobile",
    plugins: [
      ...(config.plugins ?? []),
      ...(androidKey
        ? [
            ["react-native-maps", { androidGoogleMapsApiKey: androidKey }] as [
              string,
              Record<string, string>,
            ],
          ]
        : []),
    ],
  };
};
