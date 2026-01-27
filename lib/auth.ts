import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                identifier: { label: "Username/Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error('Missing credentials');
                }

                const user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.identifier },
                            { username: credentials.identifier }
                        ]
                    }
                });

                if (!user || user.status === 'BANNED') {
                    throw new Error('Invalid credentials or account banned');
                }

                const isValid = await verifyPassword(user.password, credentials.password);

                if (!isValid) {
                    throw new Error('Invalid credentials');
                }

                return {
                    id: user.id.toString(),
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    balance: Number(user.balance), // Add balance to user object
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/login', // Correct path
        error: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 3600, // 1 Hour
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Update token if user logs in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.username = user.name;
                token.balance = (user as any).balance;
            }
            // Support updating session (e.g. after top-up)
            if (trigger === "update" && session?.balance) {
                token.balance = session.balance;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id as string,
                    role: token.role as string,
                    username: token.username as string,
                    balance: token.balance as number,
                } as any;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
