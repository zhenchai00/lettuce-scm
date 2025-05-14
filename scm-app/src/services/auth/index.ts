export const signIn = async (username: string, password: string) => {
    console.log("username", username, "password", password);
    return { username, password, role: "admin" };
};