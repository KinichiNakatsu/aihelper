import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI OCR - Multi-Platform Text Extraction",
  description: "Upload multiple images and extract text using AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
