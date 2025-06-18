import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import AuthProvider from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import "../globals.css"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }, { locale: "ja" }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  return {
    title: "AI助手 - 多平台AI工具",
    description: "一次提问，多个AI平台同时回答",
    keywords: ["AI", "ChatGPT", "DeepSeek", "多平台AI"],
  }
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
