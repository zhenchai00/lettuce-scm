import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS: string[] = [
    "/api/auth",
    "/api/public",
]

const ROLE_RULES: { [pathPrefix: string]: string[] } = {
    "/api/admin": ["admin"],
    "/api/farmer": ["admin", "farmer"],
    "/api/distributor": ["admin", "distributor"],
    "/api/retailer": ["admin", "retailer"],
}

export const middleware = async (req: NextRequest) => {
    const { pathname } = req.nextUrl

    // skip non-api routes
    if (!pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    // allow next-auth own routes + any explicitly public routes
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // grab token (JWT) from request (cookies)
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    })

    // if no token, redirect to login page
    if (!token) {
        return new NextResponse(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
        )
    }

    const rule = Object.entries(ROLE_RULES).find(([pathPrefix]) =>
        pathname.startsWith(pathPrefix)
    )
    if (rule) {
        const [prefix, allowedRoles] = rule;
        if (!allowedRoles.includes(token.role as string)) {
            return new NextResponse(
                JSON.stringify({ error: "Forbidden: Invalid / Insufficient role" }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            )
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
    ],
}
