"use client";
import { useEffect, useRef } from "react";
import type { RegistrationApiError } from "@food-map/registration";
export function SearchNotice({ notice, onClose }: { notice: RegistrationApiError | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (notice) ref.current?.showModal(); else ref.current?.close(); }, [notice]);
  return <dialog ref={ref} className="install-dialog" aria-labelledby="search-notice-title" aria-describedby="search-notice-body" onClose={onClose}>
    <h2 id="search-notice-title">검색을 잠시 중단했어요</h2>
    <p id="search-notice-body">{notice?.message}</p>
    {notice?.resetAt && <p>한도 갱신 시각: {new Date(notice.resetAt).toLocaleString("ko-KR")}<br />월별 사용량 확인이 필요한 경우 이후에도 검색이 제한될 수 있어요.</p>}
    <p>이미 선택한 장소의 카테고리는 계속 정리할 수 있어요.</p>
    <button type="button" className="button button-primary" onClick={() => ref.current?.close()}>확인</button>
  </dialog>;
}
