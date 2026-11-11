import Link from "next/link";
export function CatalogShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="catalog-app">
      <header className="app-header">
        <Link className="brand" href="/map">
          맛집지도
        </Link>
        <nav className="catalog-nav" aria-label="서비스 메뉴">
          <Link href="/map">맛집 등록</Link>
          <Link href="/saved">저장한 맛집</Link>
          <Link href="/categories">카테고리 관리</Link>
        </nav>
      </header>
      <main className="catalog-main">
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
