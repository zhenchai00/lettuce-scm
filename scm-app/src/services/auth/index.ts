export const signIn = async (email: string, password: string) => {
    console.log("email", email, "password", password, "role", "admin", "name", "admin123123");
    return { email, password, role: "admin", name: "admin123123" };
};