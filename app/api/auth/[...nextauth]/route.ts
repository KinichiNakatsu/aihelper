import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Validate required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set")
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set")
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set")
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
        accessToken: token.accessToken,
      }
    },
    async signIn({ user, account, profile }) {
      console.log("✅ Google OAuth Sign In Success:", {
        user: user?.email,
        provider: account?.provider,
        profile: profile?.name,
      })
      return true
    },
  },
  pages: {
    error: "/auth/error",
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }
