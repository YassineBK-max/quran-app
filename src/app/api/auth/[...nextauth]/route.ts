import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      // Only request minimal scopes
      authorization: {
        params: { scope: "openid email profile" },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Validate redirect target — prevent open redirects
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // malformed URL — fall through to safe default
      }
      return `${baseUrl}/auth/google-callback`;
    },
    // Only allow verified Google emails
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return Boolean((profile as { email_verified?: boolean })?.email_verified);
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
