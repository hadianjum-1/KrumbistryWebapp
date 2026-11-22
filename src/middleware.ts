// import { NextRequest, NextResponse } from "next/server";

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Protect /pos routes (except /pos/login)
//   if (pathname.startsWith("/pos") && pathname !== "/pos/login") {
//     const posSession = request.cookies.get("krumbistry_pos_session");

//     if (!posSession?.value) {
//       const loginUrl = new URL("/pos/login", request.url);
//       return NextResponse.redirect(loginUrl);
//     }
//   }

//   // Protect /admin routes (except /admin/login)
//   if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
//     const adminSession = request.cookies.get("krumbistry_admin_session");

//     if (!adminSession?.value) {
//       const loginUrl = new URL("/admin/login", request.url);
//       return NextResponse.redirect(loginUrl);
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/pos/:path*",
//     "/admin/:path*",
//   ],
// };


import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function hasOwnerPreviewAccess(request: NextRequest) {
  const token = request.cookies.get(
    "krumbistry_owner_preview"
  )?.value;

  const secretValue = process.env.OWNER_PREVIEW_JWT_SECRET;

  if (!token || !secretValue) return false;

  try {
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);

    return payload.scope === "krumbistry-owner-preview";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow framework assets and the Coming Soon page.
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/api/owner-preview/")
  ) {
    return NextResponse.next();
  }

  // Keep existing admin, POS and authentication protection intact.
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/pos") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Allow the complete public website only for the owner.
  if (await hasOwnerPreviewAccess(request)) {
    return NextResponse.next();
  }

  // Hide public API responses too.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Website is temporarily unavailable." },
      { status: 404 }
    );
  }

  return NextResponse.redirect(
    new URL("/coming-soon", request.url)
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};