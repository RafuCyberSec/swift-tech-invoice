/**
 * NextAuth configuration — Edge-compatible
 * This file must NOT import db.js (Node.js APIs) because middleware runs in Edge Runtime.
 * The authorize callback dynamically imports db.js at runtime (only in Node.js context).
 */
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
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
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
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
