import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI文章修改 - OCR文本提取",
  description: "支持多图片上传，OpenAI自动识别文字并返回结果",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="font-chinese antialiased">{children}</body>
    </html>
  )
}
