/** @type {import('next').NextConfig} */
import packageJson from './package.json' assert { type: 'json' };
const nextConfig = {
    experimental: {
        esmExternals: "loose",
    },
    reactStrictMode: false,
    output: 'standalone',
    webpack(config) {
        config.experiments = {
            asyncWebAssembly: true,
            syncWebAssembly: true,
            layers: true,
        };
        return config;
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    env: {
        NEXT_PUBLIC_APP_VERSION: packageJson.version,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
