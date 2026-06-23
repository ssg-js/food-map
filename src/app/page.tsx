import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Food Map</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          맛집 지도 서비스
        </p>
      </div>
      <Link
        href="/map"
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
      >
        맛집 지도 탐색하기
      </Link>
    </main>
  );
}
