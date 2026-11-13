import type {Place} from "./api";
/** Fictional contract fixtures. Never copied from a user's personal collection. */
export const mockPlaces:Place[]=[
 {placeId:"mock-seongsu-cutlet",name:"모의 돈카츠 성수점",address:"서울 성동구 모의길 12 (테스트 데이터)",location:{latitude:37.5445,longitude:127.0557},attributions:[]},
 {placeId:"mock-gangnam-noodle",name:"모의 평양냉면 강남점",address:"서울 강남구 모의로 24 (테스트 데이터)",location:{latitude:37.4979,longitude:127.0276},attributions:[]},
 {placeId:"mock-seongsu-pasta",name:"모의 파스타 성수점",address:"서울 성동구 모의길 36 (테스트 데이터)",location:{latitude:37.5465,longitude:127.0517},attributions:[]},
];
export function asGooglePlace(p:Place){return {id:p.placeId,displayName:{text:p.name},formattedAddress:p.address,location:p.location,attributions:p.attributions??[]};}
