"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AdminLogin() {
  const [key,setKey]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
  return <main className="admin-login"><form onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError("");
    try { const response=await fetch("/api/admin/session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key})});
      const data=await response.json();if(!response.ok)throw new Error(data.message);setKey("");router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"로그인하지 못했습니다.");}finally{setBusy(false);}}}>
    <p className="eyebrow">맛집지도 ADMIN</p><h1>관리자 로그인</h1><p>검색 사용량과 비용 보호 상태를 확인해요.</p>
    <label htmlFor="admin-key">관리자 접근 키</label><input id="admin-key" type="password" autoComplete="current-password" value={key} onChange={e=>setKey(e.target.value)} required maxLength={256}/>
    {error && <p role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy?"확인 중":"로그인"}</button>
    <a href="/map">서비스로 돌아가기</a>
  </form></main>;
}
