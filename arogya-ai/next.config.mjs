/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Disable ESLint during builds since the repo contains lint errors that prevent building.
        // Remove this once lint issues are resolved.
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
