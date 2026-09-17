/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['playwright', 'sqlite3', 'better-sqlite3'],
};

module.exports = nextConfig;
