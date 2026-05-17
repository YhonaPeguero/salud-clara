import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@data': path.resolve(process.cwd(), 'data'),
    },
  },
}

export default nextConfig
