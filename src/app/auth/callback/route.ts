import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  // Redirect to client-side page that handles the hash fragment
  return NextResponse.redirect(new URL("/auth/confirm", origin));
}