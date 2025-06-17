import prisma from "@/lib/prisma"

export const getContacts = async () => {
    const contacts = await prisma.contact.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    return contacts || [];
}
export const createContact = async (data: any) => {
    const contact = await prisma.contact.create({
        data: {
            name: data.name,
            email: data.email,
            message: data.message,
        },
    });
    return contact || null;
}