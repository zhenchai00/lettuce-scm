import { requireRole } from "@/lib/auth/role-guard";
import { NextApiRequest, NextApiResponse } from "next"
import { getToken } from "next-auth/jwt";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["admin"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "GET":
                return res.status(200).json({
                    users: [
                        { id: 1, name: "John Doe", role: "admin" },
                        { id: 2, name: "Jane Smith", role: "user" },
                        { id: 3, name: "Alice Johnson", role: "user" },
                        { id: 4, name: "Bob Brown", role: "user" },
                        { id: 5, name: "Charlie Black", role: "user" },

                    ]
                });

            default:
                res.setHeader("Allow", ["GET"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal Server Error" + error });
    }
}

export default handler;