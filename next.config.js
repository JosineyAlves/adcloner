/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['graph.facebook.com', 'scontent.xx.fbcdn.net'],
  },
}

module.exports = nextConfig 