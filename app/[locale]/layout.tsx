import type React from "react"
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import AuthProvider from "@/components/auth-provider"
import "../globals.css"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params

  const titles = {
    zh: "AI助手 - 使用多个主流AI平台",
    en: "Multi-Platform AI - AI Assistant",
    ja: "マルチプラットフォーム AI - AIアシスタント",
  }

  const descriptions = {
    zh: "AI助手 - 使用多个主流AI平台",
    en: "Ask once, get answers from multiple AI platforms",
    ja: "一度の質問で複数のAIプラットフォームから同時に回答を取得",
  }

  return {
    title: titles[locale as keyof typeof titles] || titles.zh,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.zh,
    keywords: ["AI", "ChatGPT", "DeepSeek", "GitHub Copilot", "Microsoft Copilot", "多平台AI"],
    authors: [{ name: "Multi-Platform AI" }],
    openGraph: {
      title: titles[locale as keyof typeof titles] || titles.zh,
      description: descriptions[locale as keyof typeof descriptions] || descriptions.zh,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale as keyof typeof titles] || titles.zh,
      description: descriptions[locale as keyof typeof descriptions] || descriptions.zh,
    },
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
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
