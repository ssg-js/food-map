import type { Restaurant } from "@/entities/restaurant/type/restaurant";

interface DistrictSeed {
  district: string;
  area: string;
  baseLatitude: number;
  baseLongitude: number;
  roads: readonly string[];
}

interface RestaurantConcept {
  name: string;
  category: string;
  description: string;
  ratingBase: number;
}

const BASE_RESTAURANTS: Restaurant[] = [
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

const DISTRICTS = [
  {
    district: "종로구",
    area: "서촌",
    baseLatitude: 37.5796,
    baseLongitude: 126.9694,
    roads: ["자하문로", "필운대로", "옥인길"],
  },
  {
    district: "중구",
    area: "을지로",
    baseLatitude: 37.5661,
    baseLongitude: 126.991,
    roads: ["을지로", "마른내로", "수표로"],
  },
  {
    district: "용산구",
    area: "이태원",
    baseLatitude: 37.5348,
    baseLongitude: 126.9946,
    roads: ["이태원로", "보광로", "녹사평대로"],
  },
  {
    district: "성동구",
    area: "성수",
    baseLatitude: 37.5443,
    baseLongitude: 127.0557,
    roads: ["성수이로", "연무장길", "아차산로"],
  },
  {
    district: "마포구",
    area: "연남",
    baseLatitude: 37.561,
    baseLongitude: 126.9245,
    roads: ["동교로", "성미산로", "연희로"],
  },
  {
    district: "강남구",
    area: "신사",
    baseLatitude: 37.5196,
    baseLongitude: 127.0233,
    roads: ["도산대로", "압구정로", "강남대로"],
  },
  {
    district: "송파구",
    area: "잠실",
    baseLatitude: 37.5133,
    baseLongitude: 127.1028,
    roads: ["올림픽로", "백제고분로", "송파대로"],
  },
  {
    district: "영등포구",
    area: "문래",
    baseLatitude: 37.5172,
    baseLongitude: 126.8959,
    roads: ["문래로", "도림로", "경인로"],
  },
  {
    district: "동작구",
    area: "상도",
    baseLatitude: 37.4999,
    baseLongitude: 126.9516,
    roads: ["상도로", "양녕로", "사당로"],
  },
  {
    district: "광진구",
    area: "건대",
    baseLatitude: 37.5404,
    baseLongitude: 127.0692,
    roads: ["아차산로", "능동로", "뚝섬로"],
  },
] as const satisfies readonly DistrictSeed[];

const RESTAURANT_CONCEPTS = [
  {
    name: "골목 김밥상",
    category: "한식",
    description: "정갈한 집밥 반찬과 따뜻한 국물 메뉴가 있는 한식집",
    ratingBase: 4.1,
  },
  {
    name: "비스트로 루나",
    category: "양식",
    description: "파스타와 스테이크를 편안하게 즐길 수 있는 비스트로",
    ratingBase: 4.2,
  },
  {
    name: "스시 하루",
    category: "일식",
    description: "계절 생선과 깔끔한 덮밥 메뉴가 준비된 일식당",
    ratingBase: 4.3,
  },
  {
    name: "홍등 중화주방",
    category: "중식",
    description: "볶음 요리와 면 요리가 인기인 동네 중식당",
    ratingBase: 4.0,
  },
  {
    name: "브루잉 스테이션",
    category: "카페",
    description: "스페셜티 커피와 수제 디저트를 제공하는 카페",
    ratingBase: 4.4,
  },
  {
    name: "타코 라운지",
    category: "멕시칸",
    description: "타코와 부리토를 캐주얼하게 즐길 수 있는 멕시칸 식당",
    ratingBase: 4.2,
  },
  {
    name: "포 베트남",
    category: "아시안",
    description: "진한 육수의 쌀국수와 반미가 대표 메뉴인 아시안 식당",
    ratingBase: 4.1,
  },
  {
    name: "그릴 하우스",
    category: "고기",
    description: "구이 메뉴와 사이드가 잘 갖춰진 고기 전문점",
    ratingBase: 4.3,
  },
  {
    name: "분식 연구소",
    category: "분식",
    description: "떡볶이, 튀김, 김밥을 빠르게 즐길 수 있는 분식집",
    ratingBase: 3.9,
  },
  {
    name: "그린 보울",
    category: "샐러드",
    description: "신선한 채소와 단백질 토핑을 고를 수 있는 샐러드 바",
    ratingBase: 4.0,
  },
] as const satisfies readonly RestaurantConcept[];

const GENERATED_RESTAURANTS: Restaurant[] = DISTRICTS.flatMap(
  (district, districtIndex) =>
    RESTAURANT_CONCEPTS.map((concept, conceptIndex): Restaurant => {
      const id = districtIndex * RESTAURANT_CONCEPTS.length + conceptIndex + 6;
      const coordinateOffset = (conceptIndex - 4.5) * 0.0012;
      const districtOffset = ((districtIndex % 3) - 1) * 0.0005;
      const road = district.roads[conceptIndex % district.roads.length];
      const buildingNumber = 11 + districtIndex * 9 + conceptIndex * 7;
      const rating = Math.min(
        4.9,
        concept.ratingBase + ((districtIndex + conceptIndex) % 4) * 0.1,
      );

      return {
        id: String(id),
        name: `${district.area} ${concept.name}`,
        address: `서울특별시 ${district.district} ${road} ${buildingNumber}`,
        category: concept.category,
        latitude: Number(
          (district.baseLatitude + coordinateOffset + districtOffset).toFixed(6),
        ),
        longitude: Number(
          (district.baseLongitude - coordinateOffset + districtOffset).toFixed(6),
        ),
        rating: Number(rating.toFixed(1)),
        description: `${district.area}에서 ${concept.description}`,
      };
    }),
);

export const MOCK_RESTAURANTS: Restaurant[] = [
  ...BASE_RESTAURANTS,
  ...GENERATED_RESTAURANTS,
];
