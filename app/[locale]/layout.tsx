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
    zh: "AI文章修改 - OCR文本提取工具",
    en: "AI Article Editor - OCR Text Extraction Tool",
    ja: "AI記事編集 - OCRテキスト抽出ツール",
  }

  const descriptions = {
    zh: "AI驱动的OCR文本提取和文章修改工具，支持多图片上传和智能文本识别",
    en: "AI-powered OCR text extraction and article editing tool with multi-image upload support",
    ja: "AI駆動のOCRテキスト抽出と記事編集ツール、複数画像アップロード対応",
  }

  return {
    title: titles[locale as keyof typeof titles] || titles.zh,
    description: descriptions[locale as keyof typeof descriptions] || descriptions.zh,
    keywords: ["AI", "OCR", "文本提取", "图片识别", "文章修改", "OpenAI", "文字识别"],
    authors: [{ name: "AI OCR Tool" }],
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
