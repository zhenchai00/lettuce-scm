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
                    const user = await getProductBatchById(id as string);
                    return res.status(200).json(user);
                }
                if (req.query.blockchainTx) {
                    const { blockchainTx } = req.query;
                    const user = await getProductBatchByBlockchainTx(blockchainTx as string);
                    return res.status(200).json(user);
                }
                const users = await getProductBatches();
                return res.status(200).json(users);
                break;
            case "POST":
                const newProductBatch = await createProductBatch(req.body);
                return res.status(201).json(newProductBatch);
                break;
            case "PUT":
                const { id: putId } = req.query;
                const updatedProductBatch = await updateProductBatch(putId as string, req.body);
                return res.status(200).json(updatedProductBatch);
                break;
            
            case "DELETE":
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
        console.error("Error fetching product batch:", error);
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
