import prisma from "@/lib/prisma";
import * as svc from "@/services/public/contact";

jest.mock("@/lib/prisma");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("Contact Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getContacts", () => {
        it("returns [] when DB returns null", async () => {
            (mockPrisma.contact.findMany as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await svc.getContacts();
            expect(res).toEqual([]);
            expect(mockPrisma.contact.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns array of contacts on success", async () => {
            const fake = [{ id: "c1", name: "Alice" }];
            (mockPrisma.contact.findMany as jest.Mock).mockResolvedValueOnce(
                fake as any
            );
            const res = await svc.getContacts();
            expect(res).toBe(fake);
        });

        it("propagates error when the DB call fails", async () => {
            (mockPrisma.contact.findMany as jest.Mock).mockRejectedValueOnce(
                new Error("db down")
            );
            await expect(svc.getContacts()).rejects.toThrow("db down");
        });
    });

    describe("createContact", () => {
        const input = {
            name: "Bob",
            email: "bob@example.com",
            message: "Hello!",
        };

        it("returns the created contact on success", async () => {
            const created = { id: "c2", ...input };
            (mockPrisma.contact.create as jest.Mock).mockResolvedValueOnce(
                created as any
            );

            const res = await svc.createContact(input);
            expect(res).toBe(created);
            expect(mockPrisma.contact.create).toHaveBeenCalledWith({
                data: {
                    name: input.name,
                    email: input.email,
                    message: input.message,
                },
            });
        });

        it("returns null if Prisma returns null", async () => {
            (mockPrisma.contact.create as jest.Mock).mockResolvedValueOnce(
                null as any
            );
            const res = await svc.createContact(input);
            expect(res).toBeNull();
        });

        it("propagates error when the DB call fails", async () => {
            (mockPrisma.contact.create as jest.Mock).mockRejectedValueOnce(
                new Error("write fail")
            );
            await expect(svc.createContact(input)).rejects.toThrow(
                "write fail"
            );
        });
    });
});
