import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ReactNode } from "react";
import { theme as t } from "./theme";
export function ActionButton({
  label,
  onPress,
  disabled,
  loading,
  secondary = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      aria-disabled={Boolean(disabled)}
      aria-busy={Boolean(loading)}
      accessibilityLabel={label}
      accessibilityState={{
        disabled: Boolean(disabled),
        busy: Boolean(loading),
      }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {loading && <ActivityIndicator color={secondary ? t.muted : "white"} />}
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Feedback({
  children,
  error = false,
  onRetry,
}: {
  children: ReactNode;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View
      style={[styles.feedback, error && styles.error]}
      accessibilityLiveRegion="polite"
      accessibilityRole={error ? "alert" : "text"}
    >
      <Text style={[styles.message, error && styles.errorText]}>
        {children}
      </Text>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text style={styles.retryText}>다시 시도</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    backgroundColor: t.blueDark,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondary: { backgroundColor: t.background },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  label: { color: "white", fontSize: 15, fontWeight: "700" },
  secondaryLabel: { color: "#4e5968" },
  feedback: {
    backgroundColor: t.background,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  error: { backgroundColor: t.errorBackground },
  message: { color: t.muted, fontSize: 13, lineHeight: 21 },
  errorText: { color: t.error },
  retry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start" },
  retryText: { color: t.blueDark, fontSize: 13, fontWeight: "600" },
});
