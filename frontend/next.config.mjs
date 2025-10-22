/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize font loading
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
