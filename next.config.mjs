/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'da7c23add0ce839e4989c068fbfa4394.r2.cloudflarestorage.com',
      },
    ],
  },
};

export default nextConfig;
