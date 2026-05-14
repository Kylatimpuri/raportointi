import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Sähköposti", type: "email" },
        password: { label: "Salasana", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const rows = await sql`
          SELECT id, name, email, password, role FROM users
          WHERE email = ${credentials.email as string} LIMIT 1
        `;
        const user = rows[0];
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password as string);
        if (!valid) return null;
        return { id: user.id as string, name: user.name as string, email: user.email as string, role: user.role as string };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
