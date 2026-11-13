"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCatalogApi,
  type Category,
  type EditableCategoryKind,
} from "@food-map/registration";
import { CatalogShell } from "./CatalogShell";
import { ConfirmDialog } from "./ConfirmDialog";
import { OperatorAccess } from "./OperatorAccess";
const api = createCatalogApi();
export function CategoryManager() {
  const client = useQueryClient(),
    query = useQuery({
      queryKey: ["registration", "categories"],
      queryFn: api.categories,
      retry: false,
    });
  const [editing, setEditing] = useState<Category | null>(null),
    [removing, setRemoving] = useState<Category | null>(null),
    [name, setName] = useState(""),
    [kind, setKind] = useState<EditableCategoryKind>("FOOD"),
    [notice, setNotice] = useState("");
  const action = useMutation({
    mutationFn: async (remove: boolean) =>
      remove
        ? api.deleteCategory(removing!)
        : api.updateCategory(editing!, name, kind),
    onSuccess: () => {
      setNotice(
        removing
          ? "카테고리를 삭제했어요. 맛집은 유지됩니다."
          : "카테고리를 변경했어요.",
      );
      setEditing(null);
      setRemoving(null);
      void client.invalidateQueries({
        queryKey: ["registration", "categories"],
      });
      void client.invalidateQueries({ queryKey: ["catalog"] });
    },
    retry: false,
  });
  const groups = [
    { kind: "FOOD", title: "음식 종류" },
    { kind: "PURPOSE", title: "방문 목적" },
    { kind: "DISH", title: "대표 메뉴" },
    { kind: "UNCLASSIFIED", title: "기존 카테고리 · 분류 전" },
  ] as const;
  return (
    <CatalogShell title="카테고리 관리">
      <p className="catalog-intro">
        내 계정의 분류를 정리해요. 이름과 분류를 바꿔도 기존 맛집 연결은
        유지돼요.
      </p>
      <OperatorAccess />
      {notice && (
        <p role="status" className="feedback">
          {notice}
        </p>
      )}
      {query.isPending && <p role="status">불러오는 중이에요.</p>}
      {query.isError && (
        <p role="alert">
          {query.error.message}
          <button onClick={() => void query.refetch()}>다시 시도</button>
        </p>
      )}
      {groups.map((g) => (
        <section className="catalog-filters" key={g.kind}>
          <h2>{g.title}</h2>
          {query.data
            ?.filter((c) => c.kind === g.kind)
            .map((c) => (
              <article className="category-manage-row" key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <p className="field-help">
                    연결된 맛집 {c._count?.restaurants ?? 0}곳
                  </p>
                </div>
                <div className="catalog-actions">
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      action.reset();
                      setEditing(c);
                      setName(c.name);
                      setKind(c.kind === "UNCLASSIFIED" ? "FOOD" : c.kind);
                    }}
                  >
                    이름·분류 수정
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() => {
                      action.reset();
                      setRemoving(c);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          {query.isSuccess && !query.data.some((c) => c.kind === g.kind) && (
            <p className="field-help">
              아직 카테고리가 없어요. 맛집 등록 화면에서 새로 만들 수 있어요.
            </p>
          )}
        </section>
      ))}
      {editing && (
        <ConfirmDialog
          title="카테고리 수정"
          onClose={() => {
            if (!action.isPending) setEditing(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.mutate(false);
            }}
          >
            <label htmlFor="edit-category-name">카테고리 이름</label>
            <input
              id="edit-category-name"
              className="catalog-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              required
              disabled={action.isPending}
            />
            <label htmlFor="edit-category-kind">분류</label>
            <select
              id="edit-category-kind"
              className="catalog-input"
              value={kind}
              onChange={(e) => setKind(e.target.value as EditableCategoryKind)}
              disabled={action.isPending}
            >
              <option value="FOOD">음식 종류</option>
              <option value="PURPOSE">방문 목적</option>
              <option value="DISH">대표 메뉴</option>
            </select>
            <p className="field-help">
              연결된 맛집 {editing._count?.restaurants ?? 0}곳에 새 이름과
              분류가 반영돼요.
            </p>
            {action.isError && <p role="alert">{action.error.message}</p>}
            <div className="catalog-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={action.isPending}
                onClick={() => setEditing(null)}
              >
                취소
              </button>
              <button
                className="button button-primary"
                disabled={action.isPending || !name.trim()}
              >
                변경 저장
              </button>
            </div>
          </form>
        </ConfirmDialog>
      )}
      {removing && (
        <ConfirmDialog
          title="카테고리를 삭제할까요?"
          onClose={() => {
            if (!action.isPending) setRemoving(null);
          }}
        >
          <p>
            ‘{removing.name}’과 연결된 맛집 {removing._count?.restaurants ?? 0}
            곳의 분류 연결이 해제돼요. 맛집 자체는 남아 있어요.
          </p>
          {action.isError && <p role="alert">{action.error.message}</p>}
          <div className="catalog-actions">
            <button
              className="button button-secondary"
              disabled={action.isPending}
              onClick={() => setRemoving(null)}
            >
              취소
            </button>
            <button
              className="button button-primary"
              disabled={action.isPending}
              onClick={() => action.mutate(true)}
            >
              삭제 확인
            </button>
          </div>
        </ConfirmDialog>
      )}
    </CatalogShell>
  );
}
