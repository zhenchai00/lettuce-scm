import { createContact, getContacts } from "@/services/public/contact";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        switch (req.method) {
            case "GET":
                const contacts = await getContacts();
                return res.status(200).json(contacts);
                break;

            case "POST":
                const newContact = await createContact(req.body);
                return res.status(201).json(newContact);
                break;

            default:
                res.setHeader("Allow", ["GET", "POST"]);
                res.status(405).end(`Method ${req.method} Not Allowed`);
                break;
        }
    } catch (error: any) {
        console.error("Error fetching contacts:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
        });
    }
};

export default handler;
