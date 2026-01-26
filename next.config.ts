import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {},
    headers: async () => {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: `
                            default-src 'self';
                            script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com;
                            style-src 'self' 'unsafe-inline';
                            img-src 'self' blob: data: https://res.cloudinary.com;
                            font-src 'self';
                            connect-src 'self' https://vitals.vercel-insights.com;
                        `.replace(/\s{2,}/g, ' ').trim(), // Minify
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
