import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: true,
    allowedDevOrigins: ["http://localhost:3000", "http://localhost:3001"],
};

export default nextConfig;
