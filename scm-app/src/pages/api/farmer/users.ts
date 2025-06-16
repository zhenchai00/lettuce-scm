import { requireRole } from "@/lib/auth/role-guard";
import { createUser, deleteUser, getUserByEmail, getUserById, getUsers, updateUser } from "@/services/users";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["ADMIN", "FARMER"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "GET":
                if (req.query.id) {
                    const { id } = req.query;
                    const user = await getUserById(id as string);
                    return res.status(200).json(user);
                }
                if (req.query.email) {
                    const { email } = req.query;
                    const user = await getUserByEmail(email as string);
                    return res.status(200).json(user);
                }
                const users = await getUsers();
                return res.status(200).json(users);
                break;
            // case "POST":
            //     const newUser = await createUser(req.body);
            //     return res.status(201).json(newUser);
            //     break;
            case "PUT":
                const { id: putId } = req.query;
                const updatedUser = await updateUser(putId as string, req.body);
                return res.status(200).json(updatedUser);
                break;
            // case "DELETE":
            //     const { id: deleteId } = req.query;
            //     const deletedUser = await deleteUser(deleteId as string);
            //     return res.status(200).json(deletedUser);
            //     break;

            default:
                res.setHeader("Allow", ["GET", "PUT"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal Server Error" + error });
    }
};

export default handler;
