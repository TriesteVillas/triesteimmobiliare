import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Airtable attachment CDN (URLs are signed and expire ~2h; refreshed on each ISR revalidation).
      { protocol: "https", hostname: "v5.airtableusercontent.com" },
      // YouTube video thumbnails for the channel showcase.
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
