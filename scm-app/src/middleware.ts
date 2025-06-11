import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS: string[] = ["/api/auth", "/api/public", "_next", "/static"];

const ROLE_RULES: { [pathPrefix: string]: string[] } = {
    "/api/admin": ["ADMIN"],
    "/api/farmer": ["ADMIN", "FARMER"],
    "/api/distributor": ["ADMIN", "DISTRIBUTOR"],
    "/api/retailer": ["ADMIN", "RETAILER"],
    "/admin": ["ADMIN"],
    "/farmer": ["ADMIN", "FARMER"],
    "/distributor": ["ADMIN", "DISTRIBUTOR"],
    "/retailer": ["ADMIN", "RETAILER"],
};

export const middleware = async (req: NextRequest) => {
    const { pathname } = req.nextUrl;

    // allow next-auth own routes + any explicitly public routes
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check for token (JWT)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        // Redirect to login if not authenticated
        const loginUrl = new URL("/auth/login", req.url);
        return NextResponse.redirect(loginUrl);
    }

    // Find a matching role rule for this path
    const match = Object.entries(ROLE_RULES).find(([prefix]) =>
        pathname.startsWith(prefix)
    );
    if (match) {
        const [prefix, allowedRoles] = match;
        if (!allowedRoles.includes(token.role as string)) {
            // Forbidden
            return new NextResponse(
                JSON.stringify({ error: "Forbidden: Insufficient role" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    return NextResponse.next();
};

export const config = {
    matcher: [
        "/api/:path*",
        "/admin/:path*",
        "/farmer/:path*",
        "/distributor/:path*",
        "/retailer/:path*",
    ],
};
