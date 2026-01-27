import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    ? Redis.fromEnv()
    : null;

const ratelimit = redis
    ? new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(20, "60 s"),
        analytics: false,
    })
    : null;

export default withAuth(
    async function middleware(req) {
        // RATE LIMITING
        if (ratelimit && req.nextUrl.pathname.startsWith("/api")) {
            const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
            try {
                const { success } = await ratelimit.limit(`mw_${ip}`);
                if (!success) {
                    return NextResponse.redirect(new URL("/blocked", req.url));
                }
            } catch (e) {
                console.error("RateLimit Error:", e);
            }
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            // Avoid Redirect Loop: Only allows access if token exists
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: "/auth/login",
        },
    }
);

export const config = {
    matcher: [
        // Protect Dashboard
        "/dashboard/:path*",
        // Protect API Admin/User routes
        "/api/admin/:path*",
        "/api/user/:path*",
        // Exclude Public APIs explicitly if needed, but here we just list protected ones.
    ]
};
