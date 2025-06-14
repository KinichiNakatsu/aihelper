import type React from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, Settings } from "lucide-react"
import "./globals.css"

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                {/* Navigation */}
                <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Link href={`/${locale}`} className="text-xl font-bold">
                          Multi-Platform AI
                        </Link>
                        <div className="hidden md:flex items-center space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${locale}`} className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Chat
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${locale}/ocr`} className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              OCR
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${locale}/setup`} className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Setup
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </nav>

                {/* Main Content */}
                <main>{children}</main>
              </div>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
