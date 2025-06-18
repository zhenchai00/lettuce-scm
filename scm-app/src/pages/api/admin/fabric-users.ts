import { requireRole } from "@/lib/auth/role-guard";
import {
    enrollUserFromFabricCa,
    revokeUserFromFabricCa,
} from "@/services/users/fabric";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["ADMIN"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "POST":
                if (req.body?.enroll) {
                    const {
                        enrollmentId,
                        enrollmentSecret,
                        affiliation,
                        role,
                        msp,
                    } = req.body;
                    if (
                        !enrollmentId ||
                        !enrollmentSecret ||
                        !affiliation ||
                        !role ||
                        !msp
                    ) {
                        return res
                            .status(400)
                            .json({
                                error: "Bad Request",
                                message:
                                    "Missing required fields: enrollmentId, enrollmentSecret, affiliation, role, msp",
                            });
                    }
                    const enrolledUser = await enrollUserFromFabricCa(
                        enrollmentId,
                        enrollmentSecret,
                        affiliation,
                        role,
                        msp
                    );
                    return res.status(201).json(enrolledUser);
                }
                if (req.body?.revoke) {
                    const { enrollmentId, msp } = req.body;
                    if (!enrollmentId || !msp) {
                        return res
                            .status(400)
                            .json({
                                error: "Bad Request",
                                message:
                                    "Missing required fields: enrollmentId, msp",
                            });
                    }
                    const revokedUser = await revokeUserFromFabricCa(
                        enrollmentId,
                        msp
                    );
                    return res.status(200).json(revokedUser);
                }
                break;
            default:
                res.setHeader("Allow", ["POST"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error: any) {
        if (error.code === "P2002") {
            return res
                .status(409)
                .json({
                    error: "Conflict",
                    message: `Unique constraint failed on the field: ${error.meta?.target}`,
                });
        }
        console.error("Error performing operation on fabric user:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
        });
    }
};

export default handler;
