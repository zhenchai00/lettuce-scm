import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";

/**
 * Checks if a user is authenticated and has one of the allowed roles.
 * On failure, returns an HTTP error response and ends execution.
 */
export async function requireRole(
    req: NextApiRequest,
    res: NextApiResponse,
    allowedRoles: string[]
): Promise<{ user: { id: string; role: string } } | null> {
    const session = await getSession({ req });

    if (!session || !session.user) {
        res.status(401).json({ error: "Unauthorized" });
        return null;
    }

    const { role } = session.user as { role: string };
    if (!allowedRoles.includes(role)) {
        res.status(403).json({ error: "Forbidden: Insufficient role" });
        return null;
    }

    return { user: { id: session.user.id as string, role } };
}
