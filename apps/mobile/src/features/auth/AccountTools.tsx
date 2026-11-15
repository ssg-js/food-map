import { useState } from "react";
import { ScrollView, View, Text, TextInput } from "react-native";
import { createAccountApi } from "@food-map/registration";
import { apiBaseUrl } from "../../shared/api";
import { ActionButton, Feedback } from "../../shared/ui";
const api = createAccountApi(apiBaseUrl);
export function AccountTools({
  recover = false,
  onClose,
  onSignedOut,
}: {
  recover?: boolean;
  onClose: () => void;
  onSignedOut?: () => Promise<void>;
}) {
  const [current, setCurrent] = useState(""),
    [key, setKey] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [issued, setIssued] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  async function action(kind: "find" | "issue" | "password") {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setIssued("");
    try {
      if (kind === "find") {
        const r = await api.findUsername(key);
        setNotice(`아이디는 ${r.username}예요.`);
      }
      if (kind === "issue") {
        const r = await api.issueKey(current);
        setIssued(r.recoveryKey);
        setCurrent("");
        setNotice("복구 키를 안전하게 보관해주세요. 다시 볼 수 없어요.");
      }
      if (kind === "password") {
        if (recover) await api.resetPassword(key, password, confirm);
        else await api.changePassword(current, password, confirm);
        setCurrent("");
        setKey("");
        setPassword("");
        setConfirm("");
        setDone(true);
        setNotice(
          "비밀번호를 변경했어요. 모든 기기에서 다시 로그인해주세요. 복구 키도 다시 발급해주세요.",
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const input = {
    padding: 14,
    borderWidth: 1,
    borderColor: "#d1d6db",
    borderRadius: 12,
  };
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: 24,
        gap: 16,
        backgroundColor: "#f2f4f6",
        flexGrow: 1,
      }}
    >
      <Text style={{ fontSize: 26, fontWeight: "700" }}>
        {recover ? "아이디·비밀번호 찾기" : "계정 보안"}
      </Text>
      <Text>
        {recover
          ? "보관한 복구 키가 필요해요. 최초 설정 토큰과는 달라요."
          : "현재 비밀번호로 본인 확인 후 변경하거나 복구 키를 발급해요."}
      </Text>
      {!done && (
        <View style={{ gap: 16 }}>
          {recover ? (
            <>
              <TextInput
                accessibilityLabel="복구 키"
                placeholder="복구 키"
                style={input}
                secureTextEntry
                value={key}
                onChangeText={setKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ActionButton
                secondary
                label="아이디 확인"
                disabled={busy || !key}
                onPress={() => void action("find")}
              />
            </>
          ) : (
            <>
              <TextInput
                accessibilityLabel="현재 비밀번호"
                placeholder="현재 비밀번호"
                style={input}
                secureTextEntry
                value={current}
                onChangeText={setCurrent}
              />
              <Text>
                재발급하면 기존 복구 키는 무효가 돼요. 발급 후 별도
                보관해주세요.
              </Text>
              <ActionButton
                secondary
                label="복구 키 발급·재발급"
                disabled={busy || !current}
                onPress={() => void action("issue")}
              />
            </>
          )}
          <TextInput
            accessibilityLabel="새 비밀번호"
            placeholder="새 비밀번호 (12~128자)"
            style={input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            maxLength={128}
          />
          <TextInput
            accessibilityLabel="새 비밀번호 확인"
            placeholder="새 비밀번호 확인"
            style={input}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            maxLength={128}
          />
          <Text>변경 시 기존 복구 키와 모든 로그인 세션이 폐기돼요.</Text>
          <ActionButton
            label={recover ? "비밀번호 재설정" : "비밀번호 변경"}
            disabled={busy || password.length < 12 || !confirm}
            onPress={() => void action("password")}
          />
        </View>
      )}
      {issued ? (
        <View style={{ padding: 16, backgroundColor: "white", gap: 12 }}>
          <Text>발급된 복구 키 · 이 키로 계정 비밀번호를 바꿀 수 있어요.</Text>
          <Text selectable style={{ fontSize: 16 }}>
            {issued}
          </Text>
          <ActionButton
            secondary
            label="보관했어요"
            onPress={() => setIssued("")}
          />
        </View>
      ) : null}
      {error ? <Feedback error>{error}</Feedback> : null}
      {notice ? <Feedback>{notice}</Feedback> : null}
      <ActionButton
        secondary
        label={done ? "다시 로그인" : "돌아가기"}
        onPress={() => {
          if (done && onSignedOut) void onSignedOut();
          else onClose();
        }}
      />
    </ScrollView>
  );
}
