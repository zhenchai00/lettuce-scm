import NextAuth from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import { signIn as backendSignIn } from "@/services/auth/";

interface User {
    id: string;
    name: string;
    role: string;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            role: string;
        };
    }
}

export default NextAuth({
    providers: [
        CredentialProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: Record<string, string> | undefined): Promise<User | null> {
                if (!credentials) {
                    return null;
                }
                try {
                    const user = await backendSignIn(credentials.email, credentials.password);
                    return {
                        id: user.email,
                        name: user.name,
                        role: user.role
                    };
                } catch (error: unknown) {
                    console.error("Error during authorization:", error);
                    throw new Error(`Error during authorization ${error}`);
                }
            }
        })
    ],
    session: {
        // Use JWT-based sessions for a stateless implementation
        strategy: "jwt",
    },
    pages: {
        // Redirect to this custom page on signin failure or when user is not logged in
        signIn: "/auth/login",
    },
    callbacks: {
        async jwt({ token, user }) {
        // If user is available (just after the initial sign in), add the user info to the token
        if (user) {
            token.id = user.id;
            token.name = user.name;
            if ("role" in user) {
                token.role = user.role;
            }
        }
        return token;
        },
        async session({ session, token }) {
        if (token) {
            session.user = {
                id: token.id as string,
                name: token.name as string,
                role: token.role as string,
            };
        }
        return session;
        },
    },
});