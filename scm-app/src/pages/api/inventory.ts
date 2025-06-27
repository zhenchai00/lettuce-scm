
import { requireRole } from "@/lib/auth/role-guard";
import { createInventory, deleteInventory, getInventory, getInventoryById, getInventoryByUserId, getInventoryByUserRole, updateInventory } from "@/services/inventory";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await requireRole(req, res, ["ADMIN", "FARMER", "DISTRIBUTOR", "RETAILER"]);
    if (!auth) {
        return; // Unauthorized or forbidden, response already sent
    }

    try {
        switch (req.method) {
            case "GET":
                if (req.query.id) {
                    const { id } = req.query;
                    if (id === "undefined" || id === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "ID cannot be undefined or null" });
                    }
                    const inventory = await getInventoryById(id as string);
                    return res.status(200).json(inventory);
                }
                if (req.query.userId) {
                    const { userId } = req.query;
                    if (userId === "undefined" || userId === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "User ID cannot be undefined or null" });
                    }
                    const inventory = await getInventoryByUserId(userId as string);
                    return res.status(200).json(inventory);
                }
                if (req.query.role) {
                    const { role } = req.query;
                    if (role === "undefined" || role === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "Role cannot be undefined or null" });
                    }
                    const inventories = await getInventoryByUserRole(role as string);
                    return res.status(200).json(inventories);
                }
                const inventories = await getInventory();
                return res.status(200).json(inventories);
                break;
            case "POST":
                const newInventory = await createInventory(req.body);
                return res.status(201).json(newInventory);
                break;
            case "PUT":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for edition" });
                }
                const { id: putId } = req.query;
                const updatedInventory = await updateInventory(putId as string, req.body);
                return res.status(200).json(updatedInventory);
                break;
            
            case "DELETE":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for deletion" });
                }
                const { id: deleteId } = req.query;
                const deletedInventory = await deleteInventory(deleteId as string);
                return res.status(200).json(deletedInventory);
                break;

            default:
                res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error: any) {
        console.error("Error performing operation on product batch:", error);
        if (error.code === "P2002") {
            return res.status(409).json({ error: "Conflict", message: `Unique constraint failed on the field: ${error.meta?.target}` });
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation Error",
                issues: error.issues,
            });
        }
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
        });
    }
};

export default handler;
