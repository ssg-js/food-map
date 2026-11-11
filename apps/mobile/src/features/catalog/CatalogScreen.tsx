import { useRef, useState, type ComponentRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type {
  Restaurant,
  Category,
  Place,
  EditableCategoryKind,
} from "@food-map/registration";
import { catalogApi as api } from "./api";
import { OperatorAccess } from "./OperatorAccess";
import { ActionButton, Feedback } from "../../shared/ui";
import { MapPreview } from "../../widgets/map/MapPreview";
function Chip({
  label,
  checked,
  onPress,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[s.chip, checked && s.selected]}
    >
      <Text style={{ color: checked ? "#1b64da" : "#4e5968" }}>
        {checked ? "✓ " : ""}
        {label}
      </Text>
    </Pressable>
  );
}
function SavedCard({
  item,
  onSelect,
  onEdit,
  onDelete,
}: {
  item: Restaurant;
  onSelect: (p: Place) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const place = useQuery({
    queryKey: ["place-live", item.googlePlaceId],
    queryFn: ({ signal }) => api.details(item.googlePlaceId, signal),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
  });
  return (
    <View style={s.card}>
      <Text style={s.h2}>
        {place.data?.name ?? "장소 정보를 확인하고 있어요"}
      </Text>
      <Text style={s.muted}>{place.data?.address}</Text>
      {place.isError && (
        <Feedback error onRetry={() => void place.refetch()}>
          {place.error.message}
        </Feedback>
      )}
      <View style={s.row}>
        {item.categories.map((c) => (
          <Text key={c.id} style={s.tag}>
            {c.name}
          </Text>
        ))}
      </View>
      <View style={s.row}>
        <ActionButton
          label="지도에서 보기"
          disabled={!place.data}
          onPress={() => place.data && onSelect(place.data)}
        />
        <ActionButton label="수정" secondary onPress={onEdit} />
        <ActionButton label="삭제" secondary onPress={onDelete} />
      </View>
      <ActionButton
        label="Google 지도 열기"
        secondary
        onPress={() => {
          void Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.data?.name ?? item.googlePlaceId)}&query_place_id=${encodeURIComponent(item.googlePlaceId)}`,
          );
        }}
      />
      <Text style={s.muted}>Google Maps</Text>
      {place.data?.attributions?.map((a) => (
        <Text
          key={a.providerUri ?? a.provider}
          style={s.muted}
          onPress={() => {
            if (a.providerUri?.startsWith("https://"))
              void Linking.openURL(a.providerUri);
          }}
        >
          {a.provider}
        </Text>
      ))}
    </View>
  );
}
export function CatalogScreen({ mode }: { mode: "saved" | "categories" }) {
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const client = useQueryClient(),
    [page, setPage] = useState(1),
    [food, setFood] = useState<string[]>([]),
    [purpose, setPurpose] = useState<string[]>([]),
    [place, setPlace] = useState<Place | null>(null),
    [editing, setEditing] = useState<Restaurant | null>(null),
    [category, setCategory] = useState<Category | null>(null),
    [remove, setRemove] = useState(false),
    [ids, setIds] = useState<string[]>([]),
    [name, setName] = useState(""),
    [kind, setKind] = useState<EditableCategoryKind>("FOOD"),
    [notice, setNotice] = useState("");
  const categories = useQuery({
    queryKey: ["registration", "categories"],
    queryFn: api.categories,
    retry: false,
  });
  const list = useQuery({
    queryKey: ["catalog", { page, food, purpose }],
    queryFn: () => api.list({ page, food, purpose }),
    enabled: mode === "saved",
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async () =>
      category
        ? remove
          ? api.deleteCategory(category)
          : api.updateCategory(category, name, kind)
        : editing
          ? remove
            ? api.deleteRestaurant(editing)
            : api.updateRestaurant(editing, ids)
          : Promise.reject(new Error("선택 항목 없음")),
    retry: false,
    onSuccess: () => {
      setEditing(null);
      setCategory(null);
      setNotice("변경 내용을 저장했어요.");
      setPlace(null);
      setPage(1);
      void client.invalidateQueries({ queryKey: ["catalog"] });
      void client.invalidateQueries({
        queryKey: ["registration", "categories"],
      });
    },
  });
  function editRestaurant(item: Restaurant, deleting: boolean) {
    mutation.reset();
    setEditing(item);
    setCategory(null);
    setRemove(deleting);
    setIds(item.categories.map((c) => c.id));
  }
  function editCategory(item: Category, deleting: boolean) {
    mutation.reset();
    setCategory(item);
    setEditing(null);
    setRemove(deleting);
    setName(item.name);
    setKind(item.kind === "PURPOSE" ? "PURPOSE" : "FOOD");
  }
  const groups = [
    { kind: "FOOD", title: "음식 종류" },
    { kind: "PURPOSE", title: "방문 목적" },
    { kind: "UNCLASSIFIED", title: "기존 카테고리 · 분류 전" },
  ] as const;
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.nav}>
          <Link href="/" style={s.link}>
            맛집 등록
          </Link>
          <Link href="/saved" style={s.link}>
            저장 목록
          </Link>
          <Link href="/categories" style={s.link}>
            분류 관리
          </Link>
        </View>
        <Text style={s.h1}>
          {mode === "saved" ? "저장한 맛집" : "카테고리 관리"}
        </Text>
        <OperatorAccess />
        {notice ? <Feedback>{notice}</Feedback> : null}
        {categories.isError && (
          <Feedback error onRetry={() => void categories.refetch()}>
            {categories.error.message}
          </Feedback>
        )}
        {mode === "saved" ? (
          <>
            <MapPreview key={place?.placeId ?? "empty"} place={place} />
            <View style={s.card}>
              {groups
                .filter((g) => g.kind !== "UNCLASSIFIED")
                .map((g) => (
                  <View key={g.kind}>
                    <Text style={s.h2}>{g.title}</Text>
                    <View style={s.row}>
                      {categories.data
                        ?.filter((c) => c.kind === g.kind)
                        .map((c) => (
                          <Chip
                            key={c.id}
                            label={c.name}
                            checked={(g.kind === "FOOD"
                              ? food
                              : purpose
                            ).includes(c.id)}
                            onPress={() => {
                              const update =
                                g.kind === "FOOD" ? setFood : setPurpose;
                              update((v) =>
                                v.includes(c.id)
                                  ? v.filter((x) => x !== c.id)
                                  : [...v, c.id],
                              );
                              setPage(1);
                            }}
                          />
                        ))}
                    </View>
                  </View>
                ))}
              <ActionButton
                label="필터 초기화"
                secondary
                onPress={() => {
                  setFood([]);
                  setPurpose([]);
                  setPage(1);
                }}
              />
            </View>
            <Text style={s.h2}>{list.data?.total ?? 0}곳 저장됨</Text>
            {list.isPending && <Feedback>목록을 불러오는 중이에요.</Feedback>}
            {list.isError && (
              <Feedback error onRetry={() => void list.refetch()}>
                {list.error.message}
              </Feedback>
            )}
            {list.data?.items.length === 0 && (
              <Feedback>
                조건에 맞는 맛집이 없어요. 필터를 바꾸거나 새 맛집을
                등록해주세요.
              </Feedback>
            )}
            {list.data?.items.map((item) => (
              <SavedCard
                key={item.id + item.updatedAt}
                item={item}
                onSelect={(p) => {
                  setPlace(p);
                  scroll.current?.scrollTo({ y: 0, animated: true });
                }}
                onEdit={() => editRestaurant(item, false)}
                onDelete={() => editRestaurant(item, true)}
              />
            ))}
            {list.data &&
              (page > 1 || list.data.total > list.data.pageSize) && (
                <View style={s.row}>
                  <ActionButton
                    label="이전"
                    secondary
                    disabled={page === 1}
                    onPress={() => setPage((p) => p - 1)}
                  />
                  <Text>{page}페이지</Text>
                  <ActionButton
                    label="다음"
                    secondary
                    disabled={page * list.data.pageSize >= list.data.total}
                    onPress={() => setPage((p) => p + 1)}
                  />
                </View>
              )}
          </>
        ) : (
          groups.map((g) => (
            <View style={s.card} key={g.kind}>
              <Text style={s.h2}>{g.title}</Text>
              {categories.data
                ?.filter((c) => c.kind === g.kind)
                .map((c) => (
                  <View key={c.id} style={{ gap: 10, marginTop: 16 }}>
                    <Text style={s.h2}>{c.name}</Text>
                    <Text style={s.muted}>
                      연결된 맛집 {c._count?.restaurants ?? 0}곳
                    </Text>
                    <View style={s.row}>
                      <ActionButton
                        label="이름·분류 수정"
                        secondary
                        onPress={() => editCategory(c, false)}
                      />
                      <ActionButton
                        label="삭제"
                        secondary
                        onPress={() => editCategory(c, true)}
                      />
                    </View>
                  </View>
                ))}
            </View>
          ))
        )}
      </ScrollView>
      <Modal
        visible={!!editing || !!category}
        transparent
        onRequestClose={() => {
          if (!mutation.isPending) {
            setEditing(null);
            setCategory(null);
          }
        }}
      >
        <View style={s.backdrop}>
          <ScrollView
            style={{ maxHeight: "85%" }}
            contentContainerStyle={s.dialog}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.h2}>
              {remove
                ? "삭제할까요?"
                : category
                  ? "카테고리 수정"
                  : "맛집 카테고리 수정"}
            </Text>
            {remove ? (
              <Text style={s.muted}>
                {category
                  ? `이 카테고리와 맛집 ${category._count?.restaurants ?? 0}곳의 연결이 해제됩니다. 맛집은 남아 있어요.`
                  : "공용 목록의 맛집과 분류 연결이 삭제됩니다."}
              </Text>
            ) : category ? (
              <>
                <TextInput
                  accessibilityLabel="카테고리 이름"
                  value={name}
                  onChangeText={setName}
                  maxLength={20}
                  style={s.input}
                />
                <View style={s.row}>
                  <Chip
                    label="음식 종류"
                    checked={kind === "FOOD"}
                    onPress={() => setKind("FOOD")}
                  />
                  <Chip
                    label="방문 목적"
                    checked={kind === "PURPOSE"}
                    onPress={() => setKind("PURPOSE")}
                  />
                </View>
              </>
            ) : (
              <View style={s.row}>
                {categories.data?.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    disabled={mutation.isPending}
                    checked={ids.includes(c.id)}
                    onPress={() =>
                      setIds((v) =>
                        v.includes(c.id)
                          ? v.filter((x) => x !== c.id)
                          : [...v, c.id],
                      )
                    }
                  />
                ))}
              </View>
            )}
            {mutation.isError && (
              <Feedback error>{mutation.error.message}</Feedback>
            )}
            <View style={s.row}>
              <ActionButton
                label="취소"
                secondary
                disabled={mutation.isPending}
                onPress={() => {
                  setEditing(null);
                  setCategory(null);
                }}
              />
              <ActionButton
                label={remove ? "삭제 확인" : "변경 저장"}
                disabled={
                  mutation.isPending || (!remove && !!category && !name.trim())
                }
                onPress={() => mutation.mutate()}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f2f4f6" },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  nav: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  link: { color: "#1b64da", paddingVertical: 12, fontSize: 14 },
  h1: { fontSize: 28, fontWeight: "800", color: "#191f28" },
  h2: { fontSize: 17, fontWeight: "700", color: "#191f28" },
  muted: { fontSize: 13, lineHeight: 21, color: "#6b7684" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 18, gap: 14 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  tag: {
    backgroundColor: "#e8f3ff",
    padding: 8,
    borderRadius: 12,
    color: "#1b64da",
  },
  chip: {
    minHeight: 44,
    padding: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#d1d6db",
    backgroundColor: "white",
  },
  selected: { backgroundColor: "#e8f3ff", borderColor: "#3182f6" },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#b0b8c1",
    borderRadius: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 20,
    gap: 20,
    flexGrow: 0,
  },
});
