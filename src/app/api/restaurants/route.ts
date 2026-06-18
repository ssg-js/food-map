import { NextResponse } from "next/server";

import type { Restaurant } from "@/entities/restaurant/type/restaurant";

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "맛있는 김치찌개",
    address: "서울특별시 종로구 종로 1",
    category: "한식",
    latitude: 37.5704,
    longitude: 126.9827,
    rating: 4.5,
    description: "진한 김치와 돼지고기가 어우러진 정통 김치찌개 전문점",
  },
  {
    id: "2",
    name: "이탈리안 키친",
    address: "서울특별시 강남구 테헤란로 123",
    category: "양식",
    latitude: 37.5012,
    longitude: 127.0396,
    rating: 4.2,
    description: "수제 파스타와 리조또를 맛볼 수 있는 이탈리안 레스토랑",
  },
  {
    id: "3",
    name: "스시 오마카세",
    address: "서울특별시 마포구 양화로 45",
    category: "일식",
    latitude: 37.5563,
    longitude: 126.9236,
    rating: 4.8,
    description: "신선한 회와 정성 가득한 오마카세를 즐길 수 있는 스시집",
  },
  {
    id: "4",
    name: "중화반점",
    address: "서울특별시 중구 을지로 30",
    category: "중식",
    latitude: 37.5661,
    longitude: 126.991,
    rating: 4.0,
    description: "짜장면과 탕수육이 유명한 정통 중국 요리 전문점",
  },
  {
    id: "5",
    name: "카페 브루클린",
    address: "서울특별시 성동구 성수동 2가",
    category: "카페",
    latitude: 37.5443,
    longitude: 127.0557,
    rating: 4.3,
    description: "수제 디저트와 스페셜티 커피를 즐길 수 있는 감성 카페",
  },
];

export function GET() {
  return NextResponse.json(MOCK_RESTAURANTS);
}
