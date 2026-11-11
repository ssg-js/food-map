"use client";
import { MAX_CATEGORY_LENGTH, type RegistrationController } from "@food-map/registration";
import { Icon } from "@/shared/ui/icon";
const groups = [{ kind: "FOOD", title: "음식 종류" }, { kind: "PURPOSE", title: "방문 목적" }, { kind: "UNCLASSIFIED", title: "기존 카테고리 · 분류 전" }] as const;
export function CategoryGroups({ flow }: { flow: RegistrationController }) {
  return <>{groups.map(({ kind, title }) => {
    const items = flow.categories.data?.filter(c => c.kind === kind) ?? [];
    if (kind === "UNCLASSIFIED" && !items.length) return null;
    return <section key={kind} className="category-kind-group" aria-label={title}>
      <h3>{title}</h3><p className="field-help">여러 개 선택할 수 있어요.</p>
      <div className="category-chips" role="group" aria-label={`${title} 선택`}>
        {items.map(category => {
          const selected = flow.selectedCategoryIds.includes(category.id);
          return <button type="button" key={category.id} className={`category-chip${selected ? " is-selected" : ""}`} aria-pressed={selected}
            disabled={flow.busy || !flow.existing.isSuccess} onClick={() => flow.toggleCategory(category.id)}>
            {selected && <Icon name="check" width={16} height={16} />}{category.name}</button>;
        })}
        {kind !== "UNCLASSIFIED" && <button type="button" className="category-chip category-add" disabled={flow.busy || !flow.existing.isSuccess}
          aria-label={`${title} 직접 추가`} aria-expanded={flow.newCategoryKind === kind} onClick={() => flow.openCategory(kind)}>+ 직접 추가</button>}
      </div>
      {flow.newCategoryKind === kind && <form className="create-category-form" onSubmit={e => { e.preventDefault(); flow.addCategory(); }}>
        <label htmlFor={`new-${kind}`}>새 {title}</label>
        <div className="input-row"><input id={`new-${kind}`} value={flow.newCategoryName} onChange={e => flow.setNewCategoryName(e.target.value)}
          maxLength={MAX_CATEGORY_LENGTH} disabled={flow.busy} placeholder={`${title} 이름`} />
          <button type="button" className="button button-secondary" disabled={flow.busy} onClick={() => flow.openCategory(null)}>취소</button>
          <button className="button button-primary" disabled={!flow.newCategoryName.trim() || flow.busy}>{flow.createCategory.isPending ? "추가 중" : "추가"}</button></div>
        <p className="field-help">{flow.newCategoryName.length}/{MAX_CATEGORY_LENGTH} · 카테고리는 함께 사용해요.</p>
      </form>}
    </section>;
  })}</>;
}
