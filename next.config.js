module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'puppeteer-core': 'puppeteer-core',
      });
    }
    return config;
  },
}
