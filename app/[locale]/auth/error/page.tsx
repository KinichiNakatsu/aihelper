"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Server Configuration Error",
          description: "There is a problem with the server configuration. Please contact support.",
          details: "The OAuth provider configuration is incorrect.",
        }
      case "AccessDenied":
        return {
          title: "Access Denied",
          description: "You do not have permission to sign in.",
          details: "The sign in was cancelled or access was denied.",
        }
      case "Verification":
        return {
          title: "Verification Error",
          description: "The verification token has expired or is invalid.",
          details: "Please try signing in again.",
        }
      case "OAuthSignin":
        return {
          title: "OAuth Sign In Error",
          description: "Error in constructing an authorization URL.",
          details: "Check your OAuth provider configuration.",
        }
      case "OAuthCallback":
        return {
          title: "OAuth Callback Error",
          description: "Error in handling the response from OAuth provider.",
          details: "The OAuth client was not found or is misconfigured.",
        }
      case "OAuthCreateAccount":
        return {
          title: "OAuth Account Creation Error",
          description: "Could not create OAuth account.",
          details: "There was an error linking your OAuth account.",
        }
      case "EmailCreateAccount":
        return {
          title: "Email Account Creation Error",
          description: "Could not create email account.",
          details: "There was an error creating your email account.",
        }
      case "Callback":
        return {
          title: "Callback Error",
          description: "Error in the OAuth callback handler.",
          details: "There was an error processing the authentication callback.",
        }
      case "OAuthAccountNotLinked":
        return {
          title: "Account Not Linked",
          description: "The OAuth account is not linked to any user.",
          details: "This OAuth account is not associated with an existing user account.",
        }
      case "EmailSignin":
        return {
          title: "Email Sign In Error",
          description: "Error sending the verification email.",
          details: "Could not send verification email.",
        }
      case "CredentialsSignin":
        return {
          title: "Credentials Sign In Error",
          description: "The credentials provided are incorrect.",
          details: "Please check your username and password.",
        }
      case "SessionRequired":
        return {
          title: "Session Required",
          description: "You must be signed in to access this page.",
          details: "Please sign in to continue.",
        }
      default:
        return {
          title: "Authentication Error",
          description: "An unknown error occurred during authentication.",
          details: error || "Unknown error",
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">{errorInfo.title}</CardTitle>
          <CardDescription className="mt-2">{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Details:</strong> {errorInfo.details}
            </p>
            {error && (
              <p className="text-sm text-gray-500 mt-1">
                <strong>Error Code:</strong> {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full">
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
