"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(
        media.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const didInstall = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", didInstall);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", didInstall);
    };
  }, []);
  if (installed) return null;
  async function install() {
    if (!installEvent) {
      dialog.current?.showModal();
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }
  return (
    <>
      <button
        type="button"
        className="button install-button"
        onClick={() => {
          void install();
        }}
      >
        <Icon name="download" width={17} height={17} />
        앱으로 사용
      </button>
      <dialog
        className="install-dialog"
        ref={dialog}
        aria-labelledby="install-title"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <h2 id="install-title">홈 화면에서 바로 열어요</h2>
        <p>
          iPhone·iPad: Safari의 <strong>공유 → 홈 화면에 추가</strong>를
          선택해주세요.
        </p>
        <p>
          Android·PC: Chrome 또는 Edge 메뉴에서 <strong>앱 설치</strong>나{" "}
          <strong>홈 화면에 추가</strong>를 선택해주세요.
        </p>
        <p>
          설치 메뉴가 없다면 브라우저에서 그대로 이용할 수 있어요. 검색과
          저장에는 인터넷 연결이 필요해요.
        </p>
        <form method="dialog">
          <button className="button button-primary">확인</button>
        </form>
      </dialog>
    </>
  );
}
