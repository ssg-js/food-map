"use client";
import { useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCatalogApi,
  type Restaurant,
  type Category,
  type Place,
} from "@food-map/registration";
import { CatalogShell } from "./CatalogShell";
import { OperatorAccess } from "./OperatorAccess";
import { ConfirmDialog } from "./ConfirmDialog";
import { SelectedPlaceMap } from "@/features/map/components/SelectedPlaceMap";
const api = createCatalogApi();
function PlaceCard({
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
    <article className="saved-card" id={`place-${item.googlePlaceId}`}>
      <h2>
        {place.data?.name ??
          (place.isPending ? "장소를 불러오고 있어요" : "장소 정보 확인 필요")}
      </h2>
      <p>{place.data?.address}</p>
      {place.isError && (
        <div role="alert">
          <p>{place.error.message}</p>
          <button className="text-button" onClick={() => void place.refetch()}>
            장소 정보 다시 조회
          </button>
        </div>
      )}
      <div className="category-chips">
        {item.categories.map((c) => (
          <span className="catalog-tag" key={c.id}>
            {c.name}
          </span>
        ))}
        {!item.categories.length && (
          <span className="field-help">카테고리 없음</span>
        )}
      </div>
      <div className="catalog-actions">
        <button
          className="button button-primary"
          disabled={!place.data}
          onClick={() => place.data && onSelect(place.data)}
        >
          지도에서 보기
        </button>
        <button className="button button-secondary" onClick={onEdit}>
          수정
        </button>
        <button className="text-button danger-text" onClick={onDelete}>
          삭제
        </button>
      </div>
      <p className="provider-credit">Google Maps</p>
      {place.data?.attributions?.map((a) => (
        <a
          key={a.providerUri ?? a.provider}
          href={
            a.providerUri?.startsWith("https://") ? a.providerUri : undefined
          }
          target="_blank"
          rel="noreferrer"
        >
          {a.provider}
        </a>
      ))}
    </article>
  );
}
export function SavedRestaurants({
  mapKey,
  mode = "mock",
}: {
  mapKey: string;
  mode?: "mock" | "live";
}) {
  const client = useQueryClient();
  const [food, setFood] = useState<string[]>([]),
    [purpose, setPurpose] = useState<string[]>([]),
    [dish, setDish] = useState<string[]>([]),
    [q, setQ] = useState(""),
    [submittedQ, setSubmittedQ] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<Place | null>(null),
    [edit, setEdit] = useState<Restaurant | null>(null),
    [deleting, setDeleting] = useState<Restaurant | null>(null),
    [ids, setIds] = useState<string[]>([]),
    [notice, setNotice] = useState("");
  const categories = useQuery({
    queryKey: ["registration", "categories"],
    queryFn: api.categories,
    retry: false,
  });
  const list = useQuery({
    queryKey: ["catalog", { food, purpose, dish, q: submittedQ, page }],
    queryFn: () => api.list({ food, purpose, dish, q: submittedQ, page }),
    retry: false,
  });
  const places = useQueries({
    queries: (list.data?.items || []).map((item) => ({
      queryKey: ["place-live", item.googlePlaceId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        api.details(item.googlePlaceId, signal),
      retry: false,
      staleTime: Infinity,
      gcTime: 0,
    })),
  });
  const mapPlaces = places.flatMap((q) => (q.data ? [q.data] : []));
  const mutation = useMutation({
    mutationFn: async (input: { item: Restaurant; remove: boolean }) =>
      input.remove
        ? api.deleteRestaurant(input.item)
        : api.updateRestaurant(input.item, ids),
    onSuccess: () => {
      setNotice(deleting ? "맛집을 삭제했어요." : "카테고리를 수정했어요.");
      setEdit(null);
      setDeleting(null);
      setSelected(null);
      setPage(1);
      void client.invalidateQueries({ queryKey: ["catalog"] });
      void client.invalidateQueries({ queryKey: ["restaurants"] });
      void client.invalidateQueries({
        queryKey: ["registration", "categories"],
      });
    },
    retry: false,
  });
  function toggle(id: string, kind: "FOOD" | "PURPOSE" | "DISH") {
    const update =
      kind === "FOOD" ? setFood : kind === "DISH" ? setDish : setPurpose;
    update((values) =>
      values.includes(id) ? values.filter((x) => x !== id) : [...values, id],
    );
    setPage(1);
    setSelected(null);
  }
  function select(p: Place) {
    setSelected(p);
    window.dispatchEvent(new CustomEvent("food-map-place", { detail: p }));
    document
      .getElementById("saved-map")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  const kinds = [
    { kind: "FOOD", title: "음식 종류" },
    { kind: "PURPOSE", title: "방문 목적" },
    { kind: "DISH", title: "대표 메뉴" },
  ] as const;
  return (
    <CatalogShell title="저장한 맛집">
      <p className="catalog-intro">
        기억해둔 맛집을 음식과 방문 목적에 맞춰 찾아보세요.
      </p>
      <OperatorAccess />
      <section className="catalog-filters" aria-label="저장한 맛집 필터">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmittedQ(q.trim());
            setPage(1);
            setSelected(null);
          }}
        >
          <label htmlFor="saved-query">내 카테고리 이름으로 찾기</label>
          <div className="input-row">
            <input
              id="saved-query"
              className="catalog-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={100}
            />
            <button className="button button-primary">찾기</button>
          </div>
        </form>
        {kinds.map((g) => (
          <div key={g.kind}>
            <h2>{g.title}</h2>
            <div className="category-chips">
              {categories.data
                ?.filter((c) => c.kind === g.kind)
                .map((c) => (
                  <button
                    className={`category-chip${(g.kind === "FOOD" ? food : g.kind === "DISH" ? dish : purpose).includes(c.id) ? " is-selected" : ""}`}
                    key={c.id}
                    aria-pressed={(g.kind === "FOOD"
                      ? food
                      : g.kind === "DISH"
                        ? dish
                        : purpose
                    ).includes(c.id)}
                    onClick={() => toggle(c.id, g.kind)}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          </div>
        ))}
        {categories.isError && (
          <p role="alert">
            {categories.error.message}
            <button
              className="text-button"
              onClick={() => void categories.refetch()}
            >
              다시 시도
            </button>
          </p>
        )}
        <p className="field-help">
          같은 그룹은 하나라도 포함, 음식·목적·대표 메뉴는 모두 만족하는 맛집을
          찾아요.
        </p>
        <button
          className="text-button"
          onClick={() => {
            setFood([]);
            setPurpose([]);
            setDish([]);
            setQ("");
            setSubmittedQ("");
            setSelected(null);
            setPage(1);
          }}
        >
          필터 초기화
        </button>
      </section>
      {notice && (
        <p className="feedback" role="status">
          {notice}
        </p>
      )}
      <div className="catalog-content">
        <section aria-label="저장한 맛집 목록">
          <div className="section-heading">
            <h2>
              {list.data ? `${list.data.total}곳 저장됨` : "목록 조회 중"}
            </h2>
            <button
              className="text-button"
              onClick={() => {
                setSelected(null);
                void list.refetch();
              }}
            >
              새로고침
            </button>
          </div>
          {list.isPending && <p role="status">목록을 불러오고 있어요.</p>}
          {list.isError && (
            <p role="alert">
              {list.error.message}
              <button onClick={() => void list.refetch()}>다시 시도</button>
            </p>
          )}
          {list.data?.items.length === 0 && (
            <div className="empty-state">
              <h2>조건에 맞는 맛집이 없어요</h2>
              <p>필터를 바꾸거나 새로운 맛집을 등록해보세요.</p>
              <a className="button button-primary" href="/map">
                맛집 등록
              </a>
            </div>
          )}
          {list.data?.items.map((item) => (
            <PlaceCard
              key={item.id + item.updatedAt}
              item={item}
              onSelect={select}
              onEdit={() => {
                mutation.reset();
                setIds(item.categories.map((c) => c.id));
                setEdit(item);
              }}
              onDelete={() => {
                mutation.reset();
                setDeleting(item);
              }}
            />
          ))}
          {list.data && (page > 1 || list.data.total > list.data.pageSize) && (
            <nav className="catalog-pagination" aria-label="목록 페이지">
              <button
                className="button button-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </button>
              <span>
                {page} /{" "}
                {Math.max(1, Math.ceil(list.data.total / list.data.pageSize))}
              </span>
              <button
                className="button button-secondary"
                disabled={page * list.data.pageSize >= list.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </button>
            </nav>
          )}
        </section>
        <section
          id="saved-map"
          className="catalog-map"
          aria-label="선택한 저장 맛집 지도"
        >
          <SelectedPlaceMap
            apiKey={mapKey}
            mode={mode}
            selectedPlace={selected}
            points={mapPlaces}
            onSelect={(p) => {
              setSelected(p);
              document
                .getElementById(`place-${p.placeId}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          />
          {selected && <p className="sr-only">{selected.name} 선택됨</p>}
        </section>
      </div>
      {edit && (
        <ConfirmDialog
          title="맛집 카테고리 수정"
          onClose={() => {
            if (!mutation.isPending) setEdit(null);
          }}
        >
          <p>선택한 카테고리로 내 맛집 분류를 변경합니다.</p>
          <div className="category-chips">
            {categories.data?.map((c: Category) => (
              <button
                className="category-chip"
                aria-pressed={ids.includes(c.id)}
                disabled={mutation.isPending}
                key={c.id}
                onClick={() =>
                  setIds((v) =>
                    v.includes(c.id)
                      ? v.filter((x) => x !== c.id)
                      : [...v, c.id],
                  )
                }
              >
                {ids.includes(c.id) ? "✓ " : ""}
                {c.name}
              </button>
            ))}
          </div>
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
          <div className="catalog-actions">
            <button
              className="button button-secondary"
              disabled={mutation.isPending}
              onClick={() => setEdit(null)}
            >
              취소
            </button>
            <button
              className="button button-primary"
              disabled={
                mutation.isPending ||
                !categories.isSuccess ||
                !categories.data.some(
                  (c) => c.kind !== "UNCLASSIFIED" && ids.includes(c.id),
                )
              }
              onClick={() => mutation.mutate({ item: edit, remove: false })}
            >
              변경 저장
            </button>
          </div>
        </ConfirmDialog>
      )}
      {deleting && (
        <ConfirmDialog
          title="저장한 맛집을 삭제할까요?"
          onClose={() => {
            if (!mutation.isPending) setDeleting(null);
          }}
        >
          <p>
            내 목록에서 맛집과 카테고리 연결이 삭제돼요. Google의 장소와
            카테고리 자체는 삭제하지 않아요.
          </p>
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
          <div className="catalog-actions">
            <button
              className="button button-secondary"
              disabled={mutation.isPending}
              onClick={() => setDeleting(null)}
            >
              취소
            </button>
            <button
              className="button button-primary"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ item: deleting, remove: true })}
            >
              삭제 확인
            </button>
          </div>
        </ConfirmDialog>
      )}
    </CatalogShell>
  );
}
