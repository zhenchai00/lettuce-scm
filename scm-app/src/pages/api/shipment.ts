
import { requireRole } from "@/lib/auth/role-guard";
import { createShipment, deleteShipment, getAllShipmentByUserId, getShipment, getShipmentById, updateShipment } from "@/services/shipment";
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
                    const shipment = await getShipmentById(id as string);
                    return res.status(200).json(shipment);
                }
                if (req.query.userId) {
                    const { userId } = req.query;
                    if (userId === "undefined" || userId === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "User ID cannot be undefined or null" });
                    }
                    const shipments = await getAllShipmentByUserId(userId as string);
                    return res.status(200).json(shipments);
                }
                const shipments = await getShipment();
                return res.status(200).json(shipments);
                break;
            case "POST":
                const newShipment = await createShipment(req.body);
                return res.status(201).json(newShipment);
                break;
            case "PUT":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for edition" });
                }
                const { id: putId } = req.query;
                const updatedShipment = await updateShipment(putId as string, req.body);
                return res.status(200).json(updatedShipment);
                break;
            
            case "DELETE":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for deletion" });
                }
                const { id: deleteId } = req.query;
                const deletedShipment = await deleteShipment(deleteId as string);
                return res.status(200).json(deletedShipment);
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
