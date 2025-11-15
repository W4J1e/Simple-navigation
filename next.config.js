/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['picsum.photos', 'api.yuafeng.cn', 'www.bing.com', 'bing.img.run', 'api.btstu.cn', 'api.ixiaowai.cn'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/zhihu-hot',
        destination: 'https://uapis.cn/api/v1/misc/hotboard?type=zhihu',
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // 解决缓存问题
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
      
      // 禁用缓存以避免缓存问题
      config.cache = false;
    }
    
    return config;
  },
}

module.exports = nextConfig