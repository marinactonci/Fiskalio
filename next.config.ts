import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
