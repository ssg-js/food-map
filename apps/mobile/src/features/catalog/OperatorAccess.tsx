import { View, Text } from "react-native";
import { useState } from "react";
import { usePersonalAuth } from "../auth/AuthGate";
import { ActionButton, Feedback } from "../../shared/ui";
export function OperatorAccess() {
  const { logout } = usePersonalAuth(),
    [error, setError] = useState("");
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text>내 계정의 맛집과 카테고리예요.</Text>
      <ActionButton
        secondary
        label="로그아웃"
        onPress={() => {
          void logout().catch(() =>
            setError("로그아웃에 실패했어요. 다시 시도해주세요."),
          );
        }}
      />
      {error ? <Feedback error>{error}</Feedback> : null}
    </View>
  );
}
