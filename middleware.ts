import { cookies } from "next/headers";
// import { get } from "@vercel/edge-config";

import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // const isInMaintenanceMode = await get("maintenanceMode");

  // if (isInMaintenanceMode === "true") {
  //   return NextResponse.redirect("https://tmaintainance.vercel.app");
  // }

  const cookieStore = cookies();
  const adminAuthenticated = cookieStore.get("adminAuthenticated");

  // Check if the user is authenticated
  if (!adminAuthenticated) {
    // Redirect to login only if the user is not already on the login page
    if (path !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (adminAuthenticated) {
    if (path === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
