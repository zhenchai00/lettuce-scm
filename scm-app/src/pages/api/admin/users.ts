import { requireRole } from "@/lib/auth/role-guard";
import { createUser, deleteUser, getUserByEmail, getUserById, getUsers, getUsersByRole, updateUser } from "@/services/users";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["ADMIN"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "GET":
                if (req.query.id) {
                    if (req.query.id === "undefined" || req.query.id === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "ID cannot be undefined or null" });
                    }
                    const { id } = req.query;
                    const user = await getUserById(id as string);
                    return res.status(200).json(user);
                }
                if (req.query.email) {
                    if (typeof req.query.email !== "string") {
                        return res.status(400).json({ error: "Bad Request", message: "Email must be a string" });
                    }
                    if (req.query.email === "undefined" || req.query.email === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "Email cannot be undefined or null" });
                    }
                    const { email } = req.query;
                    const user = await getUserByEmail(email as string);
                    return res.status(200).json(user);
                }
                if (req.query.role) {
                    if (typeof req.query.role !== "string") {
                        return res.status(400).json({ error: "Bad Request", message: "Role must be a string" });
                    }
                    if (req.query.role === "undefined" || req.query.role === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "Role cannot be undefined or null" });
                    }
                    const { role } = req.query;
                    const users = await getUsersByRole(role as string);
                    return res.status(200).json(users);
                }
                const users = await getUsers();
                return res.status(200).json(users);
                break;
            case "POST":
                if (!req.body || !req.body.email || !req.body.name || !req.body.password) {
                    return res.status(400).json({ error: "Bad Request", message: "Missing required fields: email, name, password" });
                }
                if (typeof req.body.email !== "string" || typeof req.body.name !== "string" || typeof req.body.password !== "string") {
                    return res.status(400).json({ error: "Bad Request", message: "Email, name, and password must be strings" });
                }
                if (req.body.email === "undefined" || req.body.email === "null" ||
                    req.body.name === "undefined" || req.body.name === "null" ||
                    req.body.password === "undefined" || req.body.password === "null") {
                    return res.status(400).json({ error: "Bad Request", message: "Email, name, and password cannot be undefined or null" });
                }
                const newUser = await createUser(req.body);
                return res.status(201).json(newUser);
                break;
            case "PUT":
                if (!req.query.id || !req.body) {
                    return res.status(400).json({ error: "Bad Request", message: "ID and body are required for update" });
                }
                if (typeof req.query.id !== "string") {
                    return res.status(400).json({ error: "Bad Request", message: "ID must be a string" });
                }
                if (req.query.id === "undefined" || req.query.id === "null") {
                    return res.status(400).json({ error: "Bad Request", message: "ID cannot be undefined or null" });
                }
                const { id: putId } = req.query;
                const updatedUser = await updateUser(putId as string, req.body);
                return res.status(200).json(updatedUser);
                break;
            case "DELETE":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for deletion" });
                }
                if (typeof req.query.id !== "string") {
                    return res.status(400).json({ error: "Bad Request", message: "ID must be a string" });
                }
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
        console.error("Error performing operation on users:", error);
        return res.status(500).json({ error: "Internal Server Error" + error });
    }
};

export default handler;
