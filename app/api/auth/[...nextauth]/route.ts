import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Sign in attempt:", { user: user?.email, account: account?.provider })
      return true
    },
  },
  pages: {
    error: "/auth/error",
  },
})

export { handler as GET, handler as POST }
