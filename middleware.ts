import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, COOKIE_VALUE } from "@/lib/auth-constants";

export function middleware(req: NextRequest) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }
  const value = req.cookies.get(COOKIE_NAME)?.value;
  if (value === COOKIE_VALUE) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
