import NextAuth from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import { signIn as backendSignIn } from "@/services/auth/";

interface User {
    id: string;
    name: string;
}

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
        };
    }
}

export default NextAuth({
    providers: [
        CredentialProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: Record<string, string> | undefined): Promise<User | null> {
                if (!credentials) {
                    return null;
                }
                try {
                    await backendSignIn(credentials.username, credentials.password);
                    return {
                        id: credentials.username,
                        name: credentials.username
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
        signIn: "/admin/login",
    },
    callbacks: {
        async jwt({ token, user }) {
        // If user is available (just after the initial sign in), add the user info to the token
        if (user) {
            token.id = user.id;
            token.name = user.name;
        }
        return token;
        },
        async session({ session, token }) {
        if (token) {
            session.user = {
            id: token.id as string,
            name: token.name as string,
            };
        }
        return session;
        },
    },
});