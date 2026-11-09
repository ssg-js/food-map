import { useRef, type ComponentRef } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  MAX_CATEGORY_LENGTH,
  MIN_SEARCH_LENGTH,
  useRegistration,
  type Place,
} from "@food-map/registration";
import { api } from "../../shared/api";
import { theme as t } from "../../shared/theme";
import { ActionButton, Feedback } from "../../shared/ui";
import { MapPreview } from "../map/MapPreview";

function Candidate({
  place,
  selected,
  disabled,
  onPress,
}: {
  place: Place;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      aria-selected={selected}
      accessibilityLabel={`${place.name}, ${place.address}${selected ? ", 선택됨" : ""}`}
      style={({ pressed }) => [
        s.candidate,
        selected && s.candidateSelected,
        pressed && s.pressed,
      ]}
    >
      <View style={[s.checkCircle, selected && s.checkCircleSelected]}>
        {selected && <Text style={s.checkText}>✓</Text>}
      </View>
      <View style={s.candidateCopy}>
        <Text style={s.candidateName}>{place.name}</Text>
        <Text style={s.candidateAddress}>{place.address}</Text>
      </View>
    </Pressable>
  );
}
export function RegistrationScreen() {
  const flow = useRegistration(api);
  const insets = useSafeAreaInsets();
  const search = useRef<ComponentRef<typeof TextInput>>(null);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const step = flow.save.isSuccess ? 3 : flow.selectedPlace ? 2 : 1;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.safe}>
      <View style={s.header}>
        <Image
          source={require("../../../assets/food-map-icon.png")}
          style={s.brandIcon}
          accessibilityIgnoresInvertColors
        />
        <Text style={s.brand}>맛집지도</Text>
      </View>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scroll}
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={false}
        >
          <MapPreview />
          <View style={s.panel}>
            <View style={s.handle} />
            <Text style={s.heading} accessibilityRole="header">
              맛집 등록
            </Text>
            <Text style={s.description}>
              발견한 맛집을 카테고리로 정리해요.
            </Text>
            <View
              style={s.steps}
              accessibilityLabel={`현재 ${step}단계, ${["장소 검색", "카테고리 선택", "등록 완료"][step - 1]}`}
            >
              {["장소 검색", "카테고리 선택", "등록 완료"].map(
                (label, index) => (
                  <View key={label} style={s.step}>
                    <View
                      style={[
                        s.stepCircle,
                        step === index + 1 && s.stepCircleActive,
                      ]}
                    >
                      <Text
                        style={[s.stepNumber, step === index + 1 && s.white]}
                      >
                        {step > index + 1 ? "✓" : index + 1}
                      </Text>
                    </View>
                    <Text
                      style={[s.stepLabel, step === index + 1 && s.activeText]}
                    >
                      {label}
                    </Text>
                    {index < 2 && <Text style={s.arrow}>›</Text>}
                  </View>
                ),
              )}
            </View>
            <Text style={s.fieldLabel}>장소 검색</Text>
            <View style={s.inputRow}>
              <TextInput
                ref={search}
                style={[s.input, s.searchInput]}
                accessibilityLabel="장소 검색"
                placeholder="지역 또는 맛집 이름"
                placeholderTextColor="#6b7684"
                value={flow.searchInput}
                onChangeText={flow.setSearchInput}
                editable={!flow.busy}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                maxLength={200}
                onSubmitEditing={() => {
                  flow.submitSearch();
                  Keyboard.dismiss();
                }}
              />
              <ActionButton
                label={flow.search.isFetching ? "검색 중" : "검색"}
                disabled={!flow.canSearch}
                loading={flow.search.isFetching}
                onPress={() => {
                  flow.submitSearch();
                  Keyboard.dismiss();
                }}
              />
            </View>
            <Text style={s.help}>
              {MIN_SEARCH_LENGTH}자 이상 입력한 뒤 검색해주세요.
            </Text>
            {!flow.submittedQuery && (
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Text style={s.emptyIconText}>⌕</Text>
                </View>
                <Text style={s.emptyTitle}>기억하고 싶은 맛집이 있나요?</Text>
                <Text style={s.emptyDescription}>
                  장소를 검색하고 카테고리를 붙여보세요.{"\n"}검색 결과에서
                  이름과 주소를 확인할 수 있어요.
                </Text>
              </View>
            )}
            {flow.search.isFetching && (
              <View style={s.loading} accessibilityLiveRegion="polite">
                <ActivityIndicator color={t.blue} />
                <Text style={s.help}>장소를 찾고 있어요</Text>
              </View>
            )}
            {flow.submittedQuery && flow.search.isError && (
              <Feedback
                error
                onRetry={() => {
                  void flow.search.refetch();
                }}
              >
                {flow.search.error.message}
              </Feedback>
            )}
            {flow.submittedQuery &&
              flow.search.isSuccess &&
              !flow.search.isFetching && (
                <View style={s.results}>
                  <View style={s.sectionHeading}>
                    <Text style={s.sectionTitle}>
                      검색 결과{" "}
                      <Text style={s.activeText}>
                        {flow.search.data.length}곳
                      </Text>
                    </Text>
                    <Text style={s.smallMuted}>장소를 선택해주세요</Text>
                  </View>
                  {flow.search.data.length === 0 ? (
                    <Feedback>
                      일치하는 장소가 없어요. 지역명과 맛집 이름을 함께
                      검색해보세요.
                    </Feedback>
                  ) : (
                    <ScrollView
                      style={s.candidateList}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                    >
                      {flow.search.data.map((place) => (
                        <Candidate
                          key={place.placeId}
                          place={place}
                          selected={
                            flow.selectedPlace?.placeId === place.placeId
                          }
                          disabled={flow.busy}
                          onPress={() => flow.selectPlace(place)}
                        />
                      ))}
                    </ScrollView>
                  )}
                  <Text style={s.credit}>장소 검색 제공 Google Maps</Text>
                </View>
              )}
            {flow.selectedPlace && (
              <View style={s.categorySection}>
                <View style={s.sectionHeading}>
                  <Text style={s.sectionTitle}>카테고리 선택</Text>
                  <Text style={s.count}>
                    {flow.selectedCategoryIds.length}개 선택
                  </Text>
                </View>
                <Text style={s.help}>
                  여러 개 선택할 수 있어요. 선택하지 않아도 저장돼요.
                </Text>
                {flow.categories.isPending && (
                  <View style={s.loading}>
                    <ActivityIndicator color={t.blue} />
                    <Text style={s.help}>카테고리를 불러오고 있어요</Text>
                  </View>
                )}
                {flow.categories.isError && (
                  <Feedback
                    error
                    onRetry={() => {
                      void flow.categories.refetch();
                    }}
                  >
                    {flow.categories.error.message}
                  </Feedback>
                )}
                {flow.categories.isSuccess && (
                  <>
                    <View style={s.chips}>
                      {flow.categories.data.map((category) => {
                        const selected = flow.selectedCategoryIds.includes(
                          category.id,
                        );
                        return (
                          <Pressable
                            key={category.id}
                            onPress={() => flow.toggleCategory(category.id)}
                            disabled={flow.busy}
                            accessibilityRole="checkbox"
                            aria-checked={selected}
                            accessibilityLabel={category.name}
                            accessibilityState={{
                              checked: selected,
                              disabled: flow.busy,
                            }}
                            style={({ pressed }) => [
                              s.chip,
                              selected && s.chipSelected,
                              pressed && s.pressed,
                            ]}
                          >
                            <Text
                              style={[s.chipText, selected && s.activeText]}
                            >
                              {selected ? "✓  " : ""}
                              {category.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {flow.categories.data.length === 0 && (
                      <Text style={s.help}>
                        아직 카테고리가 없어요. 첫 카테고리를 만들어보세요.
                      </Text>
                    )}
                    <View style={s.inputRow}>
                      <TextInput
                        style={s.input}
                        accessibilityLabel="새 카테고리 이름"
                        placeholder="새 카테고리 이름"
                        placeholderTextColor="#6b7684"
                        value={flow.newCategoryName}
                        onChangeText={flow.setNewCategoryName}
                        editable={!flow.busy}
                        maxLength={MAX_CATEGORY_LENGTH}
                        returnKeyType="done"
                        onSubmitEditing={flow.addCategory}
                      />
                      <ActionButton
                        label={
                          flow.createCategory.isPending ? "추가 중" : "+ 추가"
                        }
                        secondary
                        disabled={!flow.newCategoryName.trim() || flow.busy}
                        loading={flow.createCategory.isPending}
                        onPress={flow.addCategory}
                      />
                    </View>
                    <Text style={s.help}>
                      최대 {MAX_CATEGORY_LENGTH}자 · 카테고리는 함께 사용해요.
                    </Text>
                  </>
                )}
                {flow.validationMessage ? (
                  <Feedback>{flow.validationMessage}</Feedback>
                ) : null}
                {flow.createCategory.isError && (
                  <Feedback error>{flow.createCategory.error.message}</Feedback>
                )}
                {flow.save.isError && (
                  <Feedback error>{flow.save.error.message}</Feedback>
                )}
                {flow.save.isSuccess && (
                  <View style={s.success} accessibilityLiveRegion="polite">
                    <Text style={s.successTitle}>✓ 맛집으로 저장했어요</Text>
                    <Text style={s.successText}>
                      카테고리 {flow.save.data.categories.length}개를
                      연결했어요.
                    </Text>
                  </View>
                )}
              </View>
            )}
            <Text style={s.footer}>
              등록한 맛집의 지도 표시는 준비 중이에요.
            </Text>
          </View>
        </ScrollView>
        {flow.selectedPlace && (
          <View
            style={[
              s.bottomAction,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {flow.save.isSuccess ? (
              <ActionButton
                label="다른 맛집 등록"
                onPress={() => {
                  flow.startAgain();
                  scroll.current?.scrollTo({ y: 0, animated: true });
                  search.current?.focus();
                }}
              />
            ) : (
              <ActionButton
                label={flow.save.isPending ? "저장 중이에요" : "맛집으로 저장"}
                disabled={!flow.canSave}
                loading={flow.save.isPending}
                onPress={() => {
                  Keyboard.dismiss();
                  flow.savePlace();
                }}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "white" },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: t.line,
  },
  brandIcon: { width: 30, height: 30, borderRadius: 9 },
  brand: { color: t.blue, fontSize: 24, fontWeight: "800", letterSpacing: -1 },
  scrollContent: { flexGrow: 1, backgroundColor: t.background },
  panel: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -18,
    padding: 20,
    paddingTop: 12,
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#d1d6db",
    alignSelf: "center",
    marginBottom: 22,
  },
  heading: {
    color: t.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -1,
  },
  description: { color: t.muted, fontSize: 13, lineHeight: 22, marginTop: 5 },
  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 24,
  },
  step: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: t.background,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: t.blueDark },
  stepNumber: { color: t.muted, fontSize: 11, fontWeight: "700" },
  stepLabel: { color: t.muted, fontSize: 11, fontWeight: "600" },
  arrow: { color: "#b0b8c1", fontSize: 18, marginLeft: 4 },
  activeText: { color: t.blueDark },
  white: { color: "white" },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: t.text,
    marginBottom: 10,
  },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 16,
    color: t.text,
    backgroundColor: "white",
  },
  searchInput: { backgroundColor: "#f9fafb" },
  help: { fontSize: 12, color: t.muted, lineHeight: 19, marginTop: 8 },
  empty: { alignItems: "center", paddingVertical: 42 },
  emptyIcon: {
    backgroundColor: t.blueLight,
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: { color: t.blue, fontSize: 38 },
  emptyTitle: {
    fontSize: 16,
    color: t.text,
    fontWeight: "700",
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 23,
    color: t.muted,
    textAlign: "center",
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 24,
  },
  results: { marginTop: 24 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: t.text },
  smallMuted: { fontSize: 10, color: t.muted },
  candidateList: { maxHeight: 285 },
  candidate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    padding: 14,
    minHeight: 76,
    marginBottom: 8,
    backgroundColor: "white",
  },
  candidateSelected: { backgroundColor: t.blueLight, borderColor: t.blue },
  candidateCopy: { flex: 1, minWidth: 0 },
  candidateName: {
    fontSize: 14,
    fontWeight: "700",
    color: t.text,
    lineHeight: 21,
  },
  candidateAddress: {
    fontSize: 12,
    color: t.muted,
    lineHeight: 19,
    marginTop: 4,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#b0b8c1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleSelected: { backgroundColor: t.blue, borderColor: t.blue },
  checkText: { color: "white", fontSize: 13, fontWeight: "700" },
  credit: { fontSize: 10, color: t.muted, textAlign: "right", marginTop: 5 },
  categorySection: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: t.line,
    paddingTop: 22,
  },
  count: { color: t.blueDark, fontSize: 11, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 16 },
  chip: {
    minHeight: 44,
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 24,
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: t.blueLight, borderColor: "#d0e6ff" },
  chipText: { fontSize: 13, color: "#4e5968", fontWeight: "600" },
  pressed: { opacity: 0.7 },
  bottomAction: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: t.line,
  },
  success: {
    backgroundColor: "#eefaf4",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  successTitle: { fontSize: 15, fontWeight: "700", color: t.green },
  successText: { fontSize: 12, color: t.green, marginTop: 6 },
  footer: {
    color: t.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 8,
    lineHeight: 18,
  },
});
