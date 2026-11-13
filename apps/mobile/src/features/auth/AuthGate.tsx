import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  AppState,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import { setSessionToken } from "@food-map/registration";
import { catalogApi as api } from "../catalog/api";
import { ActionButton, Feedback } from "../../shared/ui";
const Context = createContext({ logout: async () => {} });
export const usePersonalAuth = () => useContext(Context);
// Web preview uses session memory only; native persists in encrypted platform storage.
const readToken = () =>
  Platform.OS === "web"
    ? Promise.resolve("")
    : SecureStore.getItemAsync("food-map-session");
const storeToken = (token: string) =>
  Platform.OS === "web"
    ? Promise.resolve()
    : token
      ? SecureStore.setItemAsync("food-map-session", token)
      : SecureStore.deleteItemAsync("food-map-session");
export function AuthGate({ children }: { children: ReactNode }) {
  const c = useQueryClient(),
    [ready, setReady] = useState(false),
    [user, setUser] = useState<{ id: string; username: string } | null>(null),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const clear = async () => {
    setSessionToken("");
    await storeToken("");
    c.clear();
    setUser(null);
  };
  useEffect(() => {
    let active = true;
    void readToken()
      .then(async (t) => {
        setSessionToken(t || "");
        const s = await api.session();
        if (active) setUser(s.user);
      })
      .catch(() => {
        if (active) setError("로그인 연결을 확인해주세요.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active")
        void api
          .session()
          .then((s) => {
            if (!s.user) {
              setSessionToken("");
              c.clear();
              setUser(null);
            }
          })
          .catch(() => {});
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, [c]);
  if (!ready)
    return (
      <View style={{ padding: 32 }}>
        <Text>계정을 확인하고 있어요.</Text>
      </View>
    );
  if (!user)
    return (
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 28,
          backgroundColor: "#f2f4f6",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 24,
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700" }}>
            나만의 맛집 지도
          </Text>
          <Text>아이디로 로그인해요</Text>
          <TextInput
            accessibilityLabel="아이디"
            placeholder="아이디"
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChangeText={setUsername}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: "#d1d6db",
              borderRadius: 12,
            }}
          />
          <TextInput
            accessibilityLabel="비밀번호"
            placeholder="비밀번호"
            secureTextEntry
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: "#d1d6db",
              borderRadius: 12,
            }}
          />
          {error ? <Feedback error>{error}</Feedback> : null}
          <ActionButton
            label={busy ? "로그인 중…" : "로그인"}
            disabled={busy || !username || !password}
            onPress={() => {
              setBusy(true);
              setError("");
              void api
                .login(username, password)
                .then(async (token) => {
                  await storeToken(token);
                  const s = await api.session();
                  if (!s.user) throw new Error("세션을 확인하지 못했어요.");
                  c.clear();
                  setPassword("");
                  setUser(s.user);
                })
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          />
          <Text>최초 계정은 웹 /setup에서 생성해주세요.</Text>
        </View>
      </ScrollView>
    );
  return (
    <Context.Provider
      value={{
        logout: async () => {
          await api.logout();
          await clear();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
