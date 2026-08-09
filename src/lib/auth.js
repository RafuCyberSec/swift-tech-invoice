/**
 * NextAuth configuration — Edge-compatible
 * This file must NOT import db.js (Node.js APIs) because middleware runs in Edge Runtime.
 * The authorize callback dynamically imports db.js at runtime (only in Node.js context).
 */
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "swifttech-invoice-generator-secret-key-2026-fallback-super-secure",
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember Me', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Dynamic import to avoid pulling Node.js modules into Edge Runtime
        const { getUserByEmail } = await import('./db');
        const bcrypt = (await import('bcryptjs')).default;

        const user = await getUserByEmail(credentials.email);
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          rememberMe: credentials.rememberMe === 'true',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days max
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Set expiry based on remember me preference
        if (user.rememberMe) {
          token.maxAge = 30 * 24 * 60 * 60; // 30 days
        } else {
          token.maxAge = 24 * 60 * 60; // 1 day
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
});
