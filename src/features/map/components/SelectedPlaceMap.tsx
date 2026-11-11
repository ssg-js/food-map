"use client";
import {useEffect,useState} from "react";
export function SelectedPlaceMap({apiKey}:{apiKey:string}) {
 const [place,setPlace]=useState<{placeId:string;name:string}|null>(null);
 useEffect(()=>{const select=(event:Event)=>{const p=(event as CustomEvent).detail;if(p&&typeof p.placeId==="string"&&typeof p.name==="string")setPlace(p);};window.addEventListener("food-map-place",select);return()=>window.removeEventListener("food-map-place",select);},[]);
 if(!place)return <div className="placeholder-caption">검색 결과에서 장소를 선택하면 지도에 표시돼요.</div>;
 const url=new URL("https://www.google.com/maps/embed/v1/place");url.searchParams.set("key",apiKey);url.searchParams.set("q",`place_id:${place.placeId}`);url.searchParams.set("language","ko");
 return <div style={{position:"absolute",inset:0,zIndex:3,background:"#f2f4f6"}}>{apiKey?<iframe title={`${place.name} 위치`} src={url.toString()} width="100%" height="100%" style={{border:0}} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<p>지도 연결 설정을 확인해주세요.</p>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.placeId)}`} target="_blank" rel="noopener noreferrer" style={{position:"absolute",bottom:24,left:16,background:"white",padding:12,borderRadius:12}}>Google 지도에서 {place.name} 보기 ↗</a></div>;
}
