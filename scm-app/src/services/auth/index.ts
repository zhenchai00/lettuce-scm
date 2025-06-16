import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const signIn = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        throw new Error("User not found");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        throw new Error("Invalid password");
    }

    const accessToken = jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1h",
        }
    )

    return { id: user.id, email, password, role: user.role, name: user.name, accessToken };
};