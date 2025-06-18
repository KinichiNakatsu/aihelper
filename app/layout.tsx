import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "多平台 AI - Multi-Platform AI Assistant",
  description: "一次提问，多个AI平台同时回答 - Ask once, get answers from multiple AI platforms",
  keywords: ["AI", "ChatGPT", "DeepSeek", "GitHub Copilot", "Microsoft Copilot", "多平台AI"],
  authors: [{ name: "Multi-Platform AI" }],
  openGraph: {
    title: "多平台 AI - Multi-Platform AI Assistant",
    description: "一次提问，多个AI平台同时回答",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "多平台 AI - Multi-Platform AI Assistant",
    description: "一次提问，多个AI平台同时回答",
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
