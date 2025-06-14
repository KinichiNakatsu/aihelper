"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Chrome, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Provider {
  id: string
  name: string
  type: string
  signinUrl: string
  callbackUrl: string
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setLoading(providerId)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setLoading(null)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthCallback":
        return "There was an issue with Google OAuth. Please check your configuration."
      case "AccessDenied":
        return "Access was denied. Please try again."
      case "Configuration":
        return "Server configuration error. Please contact support."
      default:
        return "An error occurred during sign in. Please try again."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>Choose your preferred sign-in method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
            </div>
          )}

          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                {provider.id === "google" && (
                  <Button
                    onClick={() => handleSignIn(provider.id)}
                    disabled={loading === provider.id}
                    className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  >
                    {loading === provider.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    ) : (
                      <Chrome className="h-4 w-4" />
                    )}
                    Sign in with {provider.name}
                  </Button>
                )}
              </div>
            ))}

          <div className="pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
