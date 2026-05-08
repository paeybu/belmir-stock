import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string
      return session
    },
    authorized({ auth }) {
      return !!auth?.user
    },
  },
  providers: [],
} satisfies NextAuthConfig
