import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = withPWAInit({
    dest: "public",
    disable: isDev,
    register: !isDev,
    reloadOnOnline: !isDev,
    cacheOnFrontEndNav: !isDev,
    aggressiveFrontEndNavCaching: !isDev,
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
};

export default withPWA(nextConfig);
