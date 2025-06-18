import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI文章修改 - OCR文本提取工具",
  description: "AI驱动的OCR文本提取和文章修改工具，支持多图片上传和智能文本识别",
  keywords: ["AI", "OCR", "文本提取", "图片识别", "文章修改", "OpenAI", "文字识别"],
  authors: [{ name: "AI OCR Tool" }],
  openGraph: {
    title: "AI文章修改 - OCR文本提取工具",
    description: "AI驱动的OCR文本提取和文章修改工具，支持多图片上传和智能文本识别",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI文章修改 - OCR文本提取工具",
    description: "AI驱动的OCR文本提取和文章修改工具，支持多图片上传和智能文本识别",
  },
  generator: "v0.dev",
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
