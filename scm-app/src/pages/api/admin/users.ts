import { UserRow } from "@/features/admin/users/type";
import { requireRole } from "@/lib/auth/role-guard";
import { createUser, deleteUser, getUserById, getUsers, updateUser } from "@/services/admin/users";
import { NextApiRequest, NextApiResponse } from "next";

const DUMMY: UserRow[] = Array.from({ length: 57 }, (_, i) => ({
    id: String(i + 1),
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 5 === 0 ? "admin" : "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}));

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["ADMIN"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "GET":
                // const page = parseInt((req.query.page as string) || "1", 10);
                // const limit = parseInt((req.query.limit as string) || "10", 10);
                // const start = (page - 1) * limit;
                // const paged = DUMMY.slice(start, start + limit);
                // return res.status(200).json({
                //     data: paged,
                //     total: DUMMY.length,
                // });
                // return res.status(200).json({
                //     users: [
                //         {
                //             id: 1,
                //             name: "John Doe",
                //             role: "admin",
                //             email: "john@example.com",
                //             createAt: new Date().toISOString(),
                //             updatedAt: new Date().toISOString(),
                //         },
                //         {
                //             id: 2,
                //             name: "Jane Smith",
                //             role: "user",
                //             email: "jane@example.com",
                //             createAt: new Date().toISOString(),
                //             updatedAt: new Date().toISOString(),
                //         },
                //         {
                //             id: 3,
                //             name: "Alice Johnson",
                //             role: "user",
                //             email: "alice@example.com",
                //             createAt: new Date().toISOString(),
                //             updatedAt: new Date().toISOString(),
                //         },
                //         {
                //             id: 4,
                //             name: "Bob Brown",
                //             role: "user",
                //             email: "bob@example.com",
                //             createAt: new Date().toISOString(),
                //             updatedAt: new Date().toISOString(),
                //         },
                //         {
                //             id: 5,
                //             name: "Charlie Black",
                //             role: "user",
                //             email: "charlie@example.com",
                //             createAt: new Date().toISOString(),
                //             updatedAt: new Date().toISOString(),
                //         },
                //     ],
                // });
                if (req.query.id) {
                    const { id } = req.query;
                    const user = await getUserById(id as string);
                    return res.status(200).json(user);
                }
                const users = await getUsers();
                return res.status(200).json(users);
                break;
            case "POST":
                const newUser = await createUser(req.body);
                return res.status(201).json(newUser);
                break;
            case "PUT":
                const { id: putId } = req.query;
                const updatedUser = await updateUser(putId as string, req.body);
                return res.status(200).json(updatedUser);
                break;
            case "DELETE":
                const { id: deleteId } = req.query;
                const deletedUser = await deleteUser(deleteId as string);
                return res.status(200).json(deletedUser);
                break;

            default:
                res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Internal Server Error" + error });
    }
};

export default handler;
