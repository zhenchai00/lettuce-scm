import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";

/**
 * Checks if a user is authenticated and has one of the allowed roles.
 * On failure, returns an HTTP error response and ends execution.
 */
export async function requireRole(
    req: NextApiRequest,
    res: NextApiResponse,
    allowedRoles: string[]
): Promise<{ role: string } | null> {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        res.status(401).json({ error: "Unauthorized: No token provided" });
        return null; // Unauthorized
    }

    const role = token.role as string | undefined;
    if (!role || !allowedRoles.includes(role)) {
        res.status(403).json({ error: "Forbidden: No role found in token" });
        return null; // Forbidden
    }

    return { role };
}
