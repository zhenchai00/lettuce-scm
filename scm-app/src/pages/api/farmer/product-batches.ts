import { requireRole } from "@/lib/auth/role-guard";
import { createProductBatch, deleteProductBatch, getProductBatchByBlockchainTx, getProductBatchById, getProductBatches, updateProductBatch } from "@/services/product-batch";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

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
                    if (id === "undefined" || id === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "ID cannot be undefined or null" });
                    }
                    const user = await getProductBatchById(id as string);
                    return res.status(200).json(user);
                }
                if (req.query.blockchainTx) {
                    if (typeof req.query.blockchainTx !== "string") {
                        return res.status(400).json({ error: "Bad Request", message: "blockchainTx must be a string" });
                    }
                    if (req.query.blockchainTx === "undefined" || req.query.blockchainTx === "null") {
                        return res.status(400).json({ error: "Bad Request", message: "blockchainTx cannot be undefined or null" });
                    }
                    const { blockchainTx } = req.query;
                    const user = await getProductBatchByBlockchainTx(blockchainTx as string);
                    return res.status(200).json(user);
                }
                const users = await getProductBatches();
                return res.status(200).json(users);
                break;
            case "POST":
                const productBatchSchema = z.object({
                    name: z.string().min(1, "Name is required"),
                    quantity: z.number().min(1, "Quantity must be greater than 0"),
                    produceType: z.string().min(1, "Produce type is required"),
                    blockchainTx: z.string().optional(),
                });
                const result = productBatchSchema.safeParse(req.body);
                if (!result.success) {
                    return res.status(400).json({
                        error: "Validation Error",
                        issues: result.error.issues,
                    });
                }
                const newProductBatch = await createProductBatch(req.body);
                return res.status(201).json(newProductBatch);
                break;
            case "PUT":
                const updateProductBatchSchema = z.object({
                    id: z.string().min(1, "ID is required"),
                    name: z.string().min(1, "Name is required").optional(),
                    quantity: z.number().min(1, "Quantity must be greater than 0").optional(),
                    produceType: z.string().min(1, "Produce type is required").optional(),
                    blockchainTx: z.string().optional(),
                });
                const updateResult = updateProductBatchSchema.safeParse(req.body);
                if (!updateResult.success) {
                    return res.status(400).json({
                        error: "Validation Error",
                        issues: updateResult.error.issues,
                    });
                }
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for update" });
                }
                if (req.query.id === "undefined" || req.query.id === "null") {
                    return res.status(400).json({ error: "Bad Request", message: "ID cannot be undefined or null" });
                }
                const { id: putId } = req.query;
                const updatedProductBatch = await updateProductBatch(putId as string, req.body);
                return res.status(200).json(updatedProductBatch);
                break;
            
            case "DELETE":
                if (!req.query.id) {
                    return res.status(400).json({ error: "Bad Request", message: "ID is required for deletion" });
                }
                const { id: deleteId } = req.query;
                const deletedProductBatch = await deleteProductBatch(deleteId as string);
                return res.status(200).json(deletedProductBatch);
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
        if (error.message.includes("produceType")) {
            return res.status(400).json({
                error: error.message,
            });
        }
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
        });
    }
};

export default handler;
