import { NextResponse } from "next/server";
import { getSessionCookieName, invalidateAdminSession } from "@/lib/session";

export async function POST(request: Request) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  if (token) {
    await invalidateAdminSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(getSessionCookieName(), { path: "/" });
  return response;
}
