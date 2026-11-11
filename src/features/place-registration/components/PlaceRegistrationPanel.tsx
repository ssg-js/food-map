"use client";
import { useRef } from "react";
import {
  createRegistrationApi,
  MIN_SEARCH_LENGTH,
  useRegistration,
} from "@food-map/registration";
import { Icon } from "@/shared/ui/icon";
import { PlaceCandidateRow } from "./PlaceCandidateRow";
import { RegistrationSteps } from "./RegistrationSteps";
import { CategoryGroups } from "./CategoryGroups";
import { SearchNotice } from "./SearchNotice";
const api = createRegistrationApi();
function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="feedback feedback-error" role="alert">
      <Icon name="info" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="text-button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  );
}
export function PlaceRegistrationPanel() {
  const flow = useRegistration(api);
  const searchRef = useRef<HTMLInputElement>(null);
  const step = flow.save.isSuccess ? 3 : flow.selectedPlace ? 2 : 1;
  return (
    <section
      className="registration-panel"
      aria-labelledby="registration-title"
      id="registration"
    >
      <SearchNotice notice={flow.searchNotice} onClose={flow.dismissSearchNotice} />
      <div className="panel-handle" aria-hidden="true" />
      <div className="panel-heading">
        <p className="eyebrow">나만의 발견, 함께 쓰는 맛집지도</p>
        <h1 id="registration-title">맛집 등록</h1>
        <p className="panel-description">발견한 맛집을 카테고리로 정리해요.</p>
      </div>
      <RegistrationSteps step={step} />
      <form
        className="place-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          flow.submitSearch();
        }}
        role="search"
        aria-label="맛집 장소 검색"
      >
        <label htmlFor="place-search">장소 검색</label>
        <div className="input-row">
          <div className="search-field">
            <Icon name="search" />
            <input
              id="place-search"
              ref={searchRef}
              type="search"
              value={flow.searchInput}
              disabled={flow.busy}
              onChange={(event) => flow.setSearchInput(event.target.value)}
              placeholder="지역 또는 맛집 이름"
              autoComplete="off"
              aria-describedby="search-help"
              maxLength={200}
            />
          </div>
          <button
            type="submit"
            className="button button-primary search-submit"
            disabled={!flow.canSearch}
          >
            {flow.search.isFetching ? (
              <span className="spinner" aria-label="검색 중" />
            ) : (
              "검색"
            )}
          </button>
        </div>
        <p className="field-help" id="search-help">
          {MIN_SEARCH_LENGTH}자 이상 입력한 뒤 검색해주세요.
        </p>
      </form>
      <div className="search-results" aria-busy={flow.search.isFetching}>
        {!flow.submittedQuery && (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="pin" width={30} height={30} />
            </span>
            <h2>기억하고 싶은 맛집이 있나요?</h2>
            <p>
              장소를 검색하고 카테고리를 붙여보세요.
              <br />
              검색 결과에서 이름과 주소를 확인할 수 있어요.
            </p>
          </div>
        )}
        {flow.search.isFetching && (
          <div className="loading-state" role="status">
            <span className="spinner" />
            장소를 찾고 있어요
          </div>
        )}
        {flow.submittedQuery && flow.search.isError && (
          <ErrorMessage
            message={flow.search.error.message}
            onRetry={() => {
              void flow.search.refetch();
            }}
          />
        )}
        {flow.submittedQuery &&
          flow.search.isSuccess &&
          !flow.search.isFetching && (
            <>
              <div className="section-heading">
                <h2>
                  검색 결과 <span>{flow.search.data.length}곳</span>
                </h2>
                <span className="small-muted">장소를 선택해주세요</span>
              </div>
              {flow.search.data.length === 0 ? (
                <div className="empty-state compact" role="status">
                  <Icon name="search" width={28} height={28} />
                  <h3>일치하는 장소가 없어요</h3>
                  <p>지역명과 맛집 이름을 함께 검색해보세요.</p>
                </div>
              ) : (
                <ul className="candidate-list">
                  {flow.search.data.map((place) => (
                    <li key={place.placeId}>
                      <PlaceCandidateRow
                        place={place}
                        selected={flow.selectedPlace?.placeId === place.placeId}
                        disabled={flow.busy}
                        onSelect={() => { flow.selectPlace(place); window.dispatchEvent(new CustomEvent("food-map-place", { detail: place })); }}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <p className="provider-credit">
                장소 검색 제공 <strong>Google Maps</strong>
              </p>
            </>
          )}
      </div>
      {flow.selectedPlace && (
        <div className="category-section">
          <div className="selected-summary">
            <span className="small-muted">선택한 장소</span>
            <strong>{flow.selectedPlace.name}</strong>
            <span>{flow.selectedPlace.address}</span>
          </div>
          <div className="section-heading">
            <h2>카테고리 선택</h2>
            <span className="selection-count">
              {flow.selectedCategoryIds.length}개 선택
            </span>
          </div>
          <p className="field-help">
            여러 개 선택할 수 있어요. 선택하지 않아도 저장돼요.
          </p>
          {flow.categories.isPending && (
            <div className="loading-state" role="status">
              <span className="spinner" />
              카테고리를 불러오고 있어요
            </div>
          )}
          {flow.categories.isError && (
            <ErrorMessage
              message={flow.categories.error.message}
              onRetry={() => {
                void flow.categories.refetch();
              }}
            />
          )}
          {flow.existing.isPending && <p role="status">저장된 카테고리를 확인하고 있어요.</p>}
          {flow.existing.isError && <ErrorMessage message={flow.existing.error.message} onRetry={flow.retryExisting} />}
          {flow.categories.isSuccess && <CategoryGroups flow={flow} />}
          {flow.newCategoryName.trim() && <p className="field-help">입력한 카테고리를 추가하거나 취소한 뒤 저장해주세요.</p>}
          {flow.validationMessage && (
            <p className="feedback" role="status">
              {flow.validationMessage}
            </p>
          )}
          {flow.createCategory.isError && (
            <ErrorMessage message={flow.createCategory.error.message} />
          )}
          <div className="save-area">
            {flow.save.isError && (
              <ErrorMessage message={flow.save.error.message} />
            )}
            {flow.save.isSuccess ? (
              <div className="save-success" role="status">
                <span className="success-icon">
                  <Icon name="check" />
                </span>
                <div>
                  <strong>맛집으로 저장했어요</strong>
                  <p>
                    카테고리 {flow.save.data.categories.length}개를 연결했어요.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    flow.startAgain();
                    searchRef.current?.focus();
                  }}
                >
                  다른 맛집 등록
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button button-primary save-button"
                onClick={flow.savePlace}
                disabled={!flow.canSave}
              >
                {flow.save.isPending ? (
                  <>
                    <span className="spinner" />
                    저장 중이에요
                  </>
                ) : (
                  "맛집으로 저장"
                )}
              </button>
            )}
          </div>
        </div>
      )}
      <p className="panel-footer">
        <Icon name="info" width={14} height={14} />
        등록한 맛집의 지도 표시는 준비 중이에요.
      </p>
    </section>
  );
}
