import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/village', destination: '/stands', permanent: true }]
  },
}
export default nextConfig
