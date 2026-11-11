import { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { catalogApi as api } from "./api";
import { ActionButton, Feedback } from "../../shared/ui";
export function OperatorAccess() {
  const client = useQueryClient(),
    [key, setKey] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [authenticated, setAuthenticated] = useState(false),
    [open, setOpen] = useState(false);
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        backgroundColor: "#e8f3ff",
        borderRadius: 16,
        marginVertical: 16,
      }}
    >
      <Text>공용 목록 수정·삭제 권한</Text>
      {authenticated ? (
        <ActionButton
          label="관리 권한 종료"
          secondary
          onPress={() => {
            void api.logout().catch(() => {});
            setAuthenticated(false);
          }}
        />
      ) : !open ? (
        <ActionButton
          label="수정·삭제 권한 확인"
          secondary
          onPress={() => setOpen(true)}
        />
      ) : (
        <>
          <TextInput
            secureTextEntry
            accessibilityLabel="관리자 접근 키"
            placeholder="관리자 접근 키"
            value={key}
            onChangeText={setKey}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ backgroundColor: "white", padding: 14, borderRadius: 10 }}
          />
          <ActionButton
            label="권한 확인"
            disabled={busy || !key}
            onPress={() => {
              setBusy(true);
              setError("");
              void api
                .login(key)
                .then(() => {
                  setKey("");
                  setAuthenticated(true);
                  void client.invalidateQueries({ queryKey: ["operator"] });
                })
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          />
        </>
      )}
      {error ? <Feedback error>{error}</Feedback> : null}
    </View>
  );
}
