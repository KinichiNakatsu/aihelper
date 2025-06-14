"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Copy, ExternalLink, AlertTriangle } from "lucide-react"
import { Chrome } from "lucide-react" // Declaring the Chrome variable

export default function OAuthSetupGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const steps = [
    {
      title: "Create Google Cloud Project",
      description: "Set up a new project in Google Cloud Console",
      completed: false,
    },
    {
      title: "Enable APIs",
      description: "Enable required Google APIs",
      completed: false,
    },
    {
      title: "Configure OAuth Consent",
      description: "Set up the OAuth consent screen",
      completed: false,
    },
    {
      title: "Create Credentials",
      description: "Generate OAuth 2.0 client credentials",
      completed: false,
    },
    {
      title: "Configure Environment",
      description: "Add credentials to your application",
      completed: false,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="h-6 w-6" />
            Google OAuth Setup Guide
          </CardTitle>
          <CardDescription>Complete step-by-step guide to set up Google OAuth for your application</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="step1">Project</TabsTrigger>
          <TabsTrigger value="step2">APIs</TabsTrigger>
          <TabsTrigger value="step3">Consent</TabsTrigger>
          <TabsTrigger value="step4">Credentials</TabsTrigger>
          <TabsTrigger value="step5">Environment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Progress</CardTitle>
              <CardDescription>Track your OAuth setup progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <Badge variant={step.completed ? "default" : "secondary"}>
                    {step.completed ? "Complete" : "Pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Create Google Cloud Project</CardTitle>
              <CardDescription>Set up a new project in Google Cloud Console</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>You'll need a Google account to access Google Cloud Console</AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Go to{" "}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click "Select a project" at the top of the page</li>
                  <li>Click "New Project"</li>
                  <li>Enter project name: "Multi-Platform AI"</li>
                  <li>Click "Create"</li>
                  <li>Wait for the project to be created and select it</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step2" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Enable Required APIs</CardTitle>
              <CardDescription>Enable Google APIs needed for OAuth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">APIs to Enable:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Google+ API</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Google People API</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>In Google Cloud Console, go to "APIs & Services" → "Library"</li>
                  <li>Search for "Google+ API" and click on it</li>
                  <li>Click "Enable"</li>
                  <li>Go back to Library and search for "Google People API"</li>
                  <li>Click on it and click "Enable"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Configure OAuth Consent Screen</CardTitle>
              <CardDescription>Set up how users will see your app during OAuth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to "APIs & Services" → "OAuth consent screen"</li>
                  <li>Choose "External" user type (unless you have Google Workspace)</li>
                  <li>Click "Create"</li>
                  <li>Fill in the required fields:</li>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <strong>App name:</strong> Multi-Platform AI
                    </li>
                    <li>
                      <strong>User support email:</strong> Your email
                    </li>
                    <li>
                      <strong>Developer contact:</strong> Your email
                    </li>
                  </ul>
                  <li>Click "Save and Continue"</li>
                  <li>On Scopes page, click "Add or Remove Scopes"</li>
                  <li>Add these scopes: email, profile, openid</li>
                  <li>Click "Save and Continue"</li>
                  <li>Add test users (your email) if in testing mode</li>
                  <li>Click "Save and Continue"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step4" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Create OAuth 2.0 Credentials</CardTitle>
              <CardDescription>Generate the client ID and secret for your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Make sure to copy your credentials immediately - you won't see the secret again!
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to "APIs & Services" → "Credentials"</li>
                  <li>Click "Create Credentials" → "OAuth 2.0 Client IDs"</li>
                  <li>Application type: "Web application"</li>
                  <li>Name: "Multi-Platform AI Web Client"</li>
                  <li>Add Authorized redirect URIs:</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Redirect URIs to add:</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded font-mono text-sm">
                    <span className="flex-1">http://localhost:3000/api/auth/callback/google</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("http://localhost:3000/api/auth/callback/google", "dev-url")}
                    >
                      {copiedText === "dev-url" ? "Copied!" : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded font-mono text-sm">
                    <span className="flex-1">https://yourdomain.com/api/auth/callback/google</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard("https://yourdomain.com/api/auth/callback/google", "prod-url")}
                    >
                      {copiedText === "prod-url" ? "Copied!" : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Replace "yourdomain.com" with your actual domain</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step5" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Configure Environment Variables</CardTitle>
              <CardDescription>Add your Google OAuth credentials to your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Add to your .env.local file:</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>GOOGLE_CLIENT_ID=your_client_id_here</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("GOOGLE_CLIENT_ID=", "client-id")}
                      >
                        {copiedText === "client-id" ? "Copied!" : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>GOOGLE_CLIENT_SECRET=your_client_secret_here</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("GOOGLE_CLIENT_SECRET=", "client-secret")}
                      >
                        {copiedText === "client-secret" ? "Copied!" : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>NEXTAUTH_SECRET=your_random_secret_here</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("NEXTAUTH_SECRET=", "nextauth-secret")}
                      >
                        {copiedText === "nextauth-secret" ? "Copied!" : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>NEXT_PUBLIC_APP_URL=http://localhost:3000</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard("NEXT_PUBLIC_APP_URL=http://localhost:3000", "app-url")}
                      >
                        {copiedText === "app-url" ? "Copied!" : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Generate a random NEXTAUTH_SECRET using:{" "}
                  <code className="bg-gray-100 px-1 rounded">openssl rand -base64 32</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">Test your setup:</h5>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Restart your development server</li>
                  <li>
                    Visit <code className="bg-gray-100 px-1 rounded">http://localhost:3000/auth/signin</code>
                  </li>
                  <li>Click "Sign in with Google"</li>
                  <li>Complete the OAuth flow</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
