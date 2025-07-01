import prisma from "@/lib/prisma";
import * as userServices from "@/services/users";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
    hash: jest.fn().mockResolvedValue("hashedPassword"),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeAll(() => {
    // Assign jest mock functions so we can use mockResolvedValueOnce, etc.
    mockPrisma.user.findMany = jest.fn();
    mockPrisma.user.findUnique = jest.fn();
    mockPrisma.user.create = jest.fn();
    mockPrisma.user.update = jest.fn();
    mockPrisma.user.delete = jest.fn();
});

describe("User service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getUsers", () => {
        it("returns [] when prisma.user.findMany resolves null", async () => {
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValueOnce(null as any);
            const res = await userServices.getUsers();
            expect(res).toEqual([]);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns the array from prisma.user.findMany", async () => {
            const fake = [{ id: "1", name: "Alice" }];
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValueOnce(fake as any);
            const res = await userServices.getUsers();
            expect(res).toBe(fake);
        });
    });

    describe("getUserById", () => {
        it("returns [] when not found", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
            const res = await userServices.getUserById("nope");
            expect(res).toEqual([]);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: "nope" },
            });
        });

        it("returns the user when found", async () => {
            const user = { id: "42", name: "Bob" };
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(user as any);
            const res = await userServices.getUserById("42");
            expect(res).toBe(user);
        });
    });

    describe("getUserByEmail", () => {
        it("throws if email is empty", async () => {
            await expect(userServices.getUserByEmail("")).rejects.toThrow(
                /not found/
            );
        });

        it("returns [] when prisma returns null", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
            const res = await userServices.getUserByEmail("a@b.com");
            expect(res).toEqual([]);
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                select: expect.objectContaining({ id: true, email: true }),
                where: { email: "a@b.com" },
            });
        });

        it("returns user when found", async () => {
            const u = {
                id: "7",
                name: "Carol",
                email: "c@d.com",
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(u as any);
            const res = await userServices.getUserByEmail("c@d.com");
            expect(res).toBe(u);
        });
    });

    describe("getUsersByRole", () => {
        it("throws if role is empty", async () => {
            await expect(userServices.getUsersByRole("")).rejects.toThrow(
                /not found/
            );
        });

        it("returns [] when none", async () => {
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValueOnce(null as any);
            const res = await userServices.getUsersByRole("user");
            expect(res).toEqual([]);
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
                where: { role: "user" },
                orderBy: { createdAt: "desc" },
            });
        });

        it("returns array when found", async () => {
            const arr = [{ id: "9", role: "user" }];
            (mockPrisma.user.findMany as jest.Mock).mockResolvedValueOnce(arr as any);
            const res = await userServices.getUsersByRole("user");
            expect(res).toBe(arr);
        });
    });

    describe("createUser", () => {
        const input = {
            name: "X",
            email: "x@y.com",
            password: "pw",
            role: "ADMIN" as const,
        };

        it("throws if user already exists", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
                id: "exists",
            } as any);
            await expect(userServices.createUser(input)).rejects.toThrow(
                /already exists/
            );
        });

        it("hashes and creates new user", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
            const created = { id: "10", ...input, passwordHash: "hashed‑pw" };
            (mockPrisma.user.create as jest.Mock).mockResolvedValueOnce(created as any);

            const res = await userServices.createUser(input);
            expect(bcrypt.hash).toHaveBeenCalledWith("pw", 10);
            expect(mockPrisma.user.create).toHaveBeenCalledWith({
                data: {
                    name: "X",
                    email: "x@y.com",
                    passwordHash: "hashedPassword",
                    role: "ADMIN",
                },
            });
            expect(res).toEqual(created);
        });
    });

    describe("updateUser", () => {
        const id = "u1";
        const data = { name: "N", email: "e@e.com", role: "ADMIN" as const };

        it("throws if user not found", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
            await expect(userServices.updateUser(id, data)).rejects.toThrow(
                /not found/
            );
        });

        it("updates when found", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id } as any);
            const updated = { id, ...data };
            (mockPrisma.user.update as jest.Mock).mockResolvedValueOnce(updated as any);

            const res = await userServices.updateUser(id, data);
            expect(mockPrisma.user.update).toHaveBeenCalledWith({
                where: { id },
                data,
            });
            expect(res).toEqual(updated);
        });
    });

    describe("deleteUser", () => {
        const id = "d1";

        it("throws if user not found", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
            await expect(userServices.deleteUser(id)).rejects.toThrow(
                /not found/
            );
        });

        it("deletes when found", async () => {
            (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id } as any);
            const deleted = { id, name: "Z" };
            (mockPrisma.user.delete as jest.Mock).mockResolvedValueOnce(deleted as any);

            const res = await userServices.deleteUser(id);
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({
                where: { id },
            });
            expect(res).toEqual(deleted);
        });
    });
});

describe("User service – error paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure all methods exist as mocks
    mockPrisma.user.findMany   = jest.fn();
    mockPrisma.user.findUnique = jest.fn();
    mockPrisma.user.create     = jest.fn();
    mockPrisma.user.update     = jest.fn();
    mockPrisma.user.delete     = jest.fn();
  });

  it("getUsers throws when underlying findMany rejects", async () => {
    (mockPrisma.user.findMany as jest.Mock).mockRejectedValueOnce(new Error("DB error"));
    await expect(userServices.getUsers())
      .rejects
      .toThrow("Failed to fetch users: Error: DB error");
  });

  it("getUserById throws when findUnique rejects", async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error("nope"));
    await expect(userServices.getUserById("u123"))
      .rejects
      .toThrow("User with ID u123 not found");
  });

  it("getUserByEmail throws when findUnique rejects", async () => {
    // valid non‑empty email so it hits prisma
    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValueOnce(new Error("err"));
    await expect(userServices.getUserByEmail("a@b.com"))
      .rejects
      .toThrow("User with email a@b.com not found");
  });

  it("getUsersByRole throws when findMany rejects", async () => {
    (mockPrisma.user.findMany as jest.Mock).mockRejectedValueOnce(new Error("bad role"));
    await expect(userServices.getUsersByRole("admin"))
      .rejects
      .toThrow("Users with role admin not found");
  });

  it("createUser throws when prisma.create rejects", async () => {
    // first findUnique returns null so we proceed to create
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
    (mockPrisma.user.create as jest.Mock).mockRejectedValueOnce(new Error("create fail"));
    await expect(userServices.createUser({
      name: "X",
      email: "x@x.com",
      password: "pass",
      role: "ADMIN"
    }))
      .rejects
      .toThrow("Failed to create user: Error: create fail");
  });

  it("updateUser throws when update rejects", async () => {
    // simulate existingUser found, then update fails
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "u1" } as any);
    (mockPrisma.user.update as jest.Mock).mockRejectedValueOnce(new Error("upd error"));
    await expect(userServices.updateUser("u1", {
      name: "N", email: "e@e.com", role: "ADMIN"
    }))
      .rejects
      .toThrow("Failed to update user with ID u1: Error: upd error");
  });

  it("deleteUser throws when delete rejects", async () => {
    // simulate existingUser found, then delete fails
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: "u2" } as any);
    (mockPrisma.user.delete as jest.Mock).mockRejectedValueOnce(new Error("del fail"));
    await expect(userServices.deleteUser("u2"))
      .rejects
      .toThrow("Failed to delete user with ID u2: Error: del fail");
  });
});