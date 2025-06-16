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
            if (user && "accessToken" in user) {
                token.accessToken = user.accessToken;
                token.role = (user as any).role;
            }
            return token;
        },
        // 2) Each time `useSession()` or getSession() is called, copy token fields into `session`
        async session({ session, token }) {
            const dbUser = await getUserById(token.sub!);
            session.accessToken =
                typeof token.accessToken === "string"
                    ? token.accessToken
                    : undefined;
            session.user = {
                id: token.sub!,
                name: dbUser?.name || "",
                role: token.role as string,
            };
            return session;
        },
    },
});
