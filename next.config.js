module.exports = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/campaigns',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [

    ],
  },
};