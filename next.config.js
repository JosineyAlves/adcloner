/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['lucide-react']
  },
  // Desabilitar geração estática para páginas problemáticas
  generateStaticParams: false,
  // Configurações para evitar timeouts
  staticPageGenerationTimeout: 120,
  // Configurações de build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configurações de imagens
  images: {
    domains: ['graph.facebook.com'],
  },
}

module.exports = nextConfig