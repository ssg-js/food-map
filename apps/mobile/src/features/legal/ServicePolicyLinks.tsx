import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { apiBaseUrl } from "../../shared/api";
export function ServicePolicyLinks() {
  const [error, setError] = useState("");
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { path: "/terms", label: "서비스 이용 안내" },
          { path: "/privacy", label: "데이터 처리 안내" },
        ].map((item) => (
          <Pressable
            key={item.path}
            accessibilityRole="link"
            onPress={() => {
              setError("");
              void Linking.openURL(apiBaseUrl + item.path).catch(() =>
                setError("안내 페이지를 열지 못했어요. 연결을 확인해주세요."),
              );
            }}
            style={{
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 8,
            }}
          >
            <Text style={{ color: "#1b64da", fontSize: 13 }}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}
