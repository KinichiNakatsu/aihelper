import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI助手 - 使用多个主流AI平台",
  description: "AI助手 - 使用多个主流AI平台 - Ask once, get answers from multiple AI platforms",
  keywords: ["AI", "ChatGPT", "DeepSeek", "GitHub Copilot", "Microsoft Copilot", "多平台AI"],
  authors: [{ name: "Multi-Platform AI" }],
  openGraph: {
    title: "AI助手 - 使用多个主流AI平台",
    description: "AI助手 - 使用多个主流AI平台",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI助手 - 使用多个主流AI平台",
    description: "AI助手 - 使用多个主流AI平台",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-chinese antialiased">{children}</body>
    </html>
  )
}
