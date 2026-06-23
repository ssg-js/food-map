import { NextResponse } from "next/server";

import { MOCK_RESTAURANTS } from "@/shared/constants/mock-restaurants";

export function GET() {
  return NextResponse.json(MOCK_RESTAURANTS);
}
