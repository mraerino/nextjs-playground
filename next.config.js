/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    defaultLocale: "en",
    locales: ["de", "en"],
  },
  redirects: async () => [
    {
      source: "/old/:some*",
      destination: "/new/:some",
      permanent: true,
      has: [
        {
          type: "host",
          value: "example.org",
        },
        {
          type: "header",
          key: "accept",
          value: "image/avif",
        },
        {
          type: "header",
          key: "accept",
          value: "image/webp",
        },
      ],
    },
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/early-rewrite",
        destination: "/foo1",
      },
    ],
    afterFiles: [
      {
        source: "/after-static-files",
        destination: "/dynamic-rewrite",
      },
    ],
    fallback: [
      {
        source: "/last-one",
        destination: "/lights-off",
      },
    ],
  }),
};

module.exports = nextConfig;
