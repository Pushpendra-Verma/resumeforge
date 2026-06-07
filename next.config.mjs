/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Resume parsing (pdfjs-dist / mammoth) runs entirely client-side.
  // Don't fail the production build on lint warnings during code generation.
  eslint: { ignoreDuringBuilds: true },
  webpack: (config) => {
    // pdfjs-dist references the Node "canvas" package, which we never use in the browser.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
