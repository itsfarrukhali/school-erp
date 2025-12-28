// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Role-based route protection middleware
 * Ensures users can only access their designated dashboard
 */

// Define role-to-route mapping
const ROLE_ROUTES: Record<string, string> = {
  SUPERADMIN: "/superadmin",
  ADMIN: "/admin",
  SCHOOLADMIN: "/schooladmin",
  PRINCIPAL: "/principal",
  ACCOUNTANT: "/accountant",
  ADMISSIONOFFICER: "/admission",
  COMPUTEROPERATOR: "/operator",
  TEACHER: "/teacher",
  CAMPUSHEAD: "/campushead",
  PARENT: "/parent",
  STUDENT: "/student",
};

// Define which roles can access which routes
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/superadmin": ["SUPERADMIN"],
  "/admin": ["ADMIN"],
  "/schooladmin": ["SCHOOLADMIN"],
  "/principal": ["PRINCIPAL"],
  "/accountant": ["ACCOUNTANT"],
  "/admission": ["ADMISSIONOFFICER"],
  "/operator": ["COMPUTEROPERATOR"],
  "/teacher": ["TEACHER"],
  "/campushead": ["CAMPUSHEAD"],
  "/parent": ["PARENT"],
  "/student": ["STUDENT"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const publicRoutes = ["/login", "/signup", "/verify-email", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (they have their own auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes("/favicon.ico") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  // Check if user is trying to access a dashboard route
  const dashboardRoutes = Object.keys(ROUTE_PERMISSIONS);
  const requestedDashboard = dashboardRoutes.find((route) => pathname.startsWith(route));

  if (requestedDashboard) {
    const allowedRoles = ROUTE_PERMISSIONS[requestedDashboard];

    // Check if user's role is allowed to access this route
    if (!allowedRoles.includes(userRole)) {
      // Redirect to user's correct dashboard
      const correctDashboard = ROLE_ROUTES[userRole];
      
      if (correctDashboard) {
        console.warn(
          `[RBAC] Unauthorized access attempt: User with role ${userRole} tried to access ${pathname}`
        );
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      } else {
        // If no dashboard defined for role, redirect to login
        console.error(`[RBAC] No dashboard defined for role: ${userRole}`);
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // If accessing root or app route, redirect to correct dashboard
  if (pathname === "/" || pathname === "/dashboard") {
    const correctDashboard = ROLE_ROUTES[userRole];
    if (correctDashboard) {
      return NextResponse.redirect(new URL(correctDashboard, request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
