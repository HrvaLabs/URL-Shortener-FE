const devApiOrigin = process.env.DEV_API_ORIGIN ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEV_API_ORIGIN: devApiOrigin,
  },
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    // Proxy API and OAuth2 calls to the backend during development to avoid CORS.
    // Production uses the same origin (hrva.cc), so no rewrite needed.
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${devApiOrigin}/api/v1/:path*`,
        },
        {
          source: "/oauth2/:path*",
          destination: `${devApiOrigin}/oauth2/:path*`,
        },
        {
          source: "/login/:path*",
          destination: `${devApiOrigin}/login/:path*`,
        },
        {
          source: "/api/changelog",
          destination: `${devApiOrigin}/api/changelog`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
