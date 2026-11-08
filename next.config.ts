import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // No other site may show the app inside a frame (clickjacking).
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self'" }],
      },
    ];
  },
  async redirects() {
    // Old nested routes (profile › bill › instances) now live in flat views.
    return [
      { source: "/profiles", destination: "/bills", permanent: false },
      {
        source: "/profiles/:id",
        destination: "/bills?profile=:id",
        permanent: false,
      },
      { source: "/bills/:id", destination: "/bills?bill=:id", permanent: false },
    ];
  },
};

export default nextConfig;
