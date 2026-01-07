import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },

  allowedDevOrigins: ["e2f32fd1ea11.ngrok-free.app"],
};

export default nextConfig;
