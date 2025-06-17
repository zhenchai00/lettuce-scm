import NextAuth from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import { signIn as backendSignIn } from "@/services/auth/";
import { getUserById } from "@/services/users";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            role: string;
        };
        accessToken?: string;
    }
    interface JWT {
        accessToken?: string;
        role?: string;
    }
    interface User {
        id: string;
        name: string;
        email: string;
        role: string;
        accessToken?: string;
    }
}

export default NextAuth({
    providers: [
        CredentialProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials) {
                    return null;
                }
                try {
                    const user = await backendSignIn(
                        credentials!.email,
                        credentials!.password
                    );
                    if (!user) {
                        return null;
                    }
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        accessToken: user.accessToken,
                    };
                } catch (error: unknown) {
                    console.error("Error during authorization:", error);
                    throw new Error(`Error during authorization ${error}`);
                }
            },
        }),
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
        // 1) On sign-in, `user` is defined. Copy accessToken/role into the NextAuth JWT.
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
                token.accessToken = user.accessToken;
            }
            return token;
        },
        // 2) Each time `useSession()` or getSession() is called, copy token fields into `session`
        async session({ session, token }) {
            session.user = {
                id: token.id as string,
                name: token.name as string,
                role: token.role as string,
            };
            session.accessToken = token.accessToken as string | undefined;
            return session;
        },
    },
});
