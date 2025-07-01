// tests/services/auth/index.test.ts
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { signIn } from "@/services/auth";

jest.mock("@/lib/prisma");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCompare = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
>;
const mockJwtSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>;

describe("signIn", () => {
    const EMAIL = "alice@example.com";
    const PASSWORD = "hunter2";
    const PASSWORD_HASH = "$2b$10$abcdefghijklmnopqrstuv"; // dummy

    const USER = {
        id: "u1",
        email: EMAIL,
        passwordHash: PASSWORD_HASH,
        role: "USER" as const,
        name: "Alice",
    };

    beforeAll(() => {
        process.env.JWT_SECRET = "test-secret";
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws if no user with that email", async () => {
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
        await expect(signIn(EMAIL, PASSWORD)).rejects.toThrow("User not found");
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: EMAIL },
        });
    });

    it("throws if password is incorrect", async () => {
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(USER as any);
        (mockCompare as jest.Mock).mockResolvedValueOnce(false);
        await expect(signIn(EMAIL, PASSWORD)).rejects.toThrow(
            "Invalid password"
        );
        expect(mockCompare).toHaveBeenCalledWith(PASSWORD, PASSWORD_HASH);
    });

    it("returns token and user info on success", async () => {
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce(USER as any);
        (mockCompare as jest.Mock).mockResolvedValueOnce(true);
        (mockJwtSign as jest.Mock).mockImplementationOnce(
            (payload: any, secret: any, opts: any) => {
                // check that payload contains the right claims:
                expect(payload).toMatchObject({
                    sub: USER.id,
                    email: USER.email,
                    role: USER.role,
                    name: USER.name,
                });
                expect(secret).toBe(process.env.JWT_SECRET);
                expect(opts).toMatchObject({ expiresIn: "1h" });
                return "signed.jwt.token";
            }
        );

        const result = await signIn(EMAIL, PASSWORD);

        expect(result).toEqual({
            id: USER.id,
            email: EMAIL,
            password: PASSWORD,
            role: USER.role,
            name: USER.name,
            accessToken: "signed.jwt.token",
        });

        // sanity-check calls:
        expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(mockCompare).toHaveBeenCalledTimes(1);
        expect(mockJwtSign).toHaveBeenCalledTimes(1);
    });
});
