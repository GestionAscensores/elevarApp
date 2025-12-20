/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {
        // serverActions is true by default in Next 14, but strict checking might require this
    }
};

export default nextConfig;
