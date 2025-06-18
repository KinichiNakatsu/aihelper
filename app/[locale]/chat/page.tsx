import MultiPlatformAI from "@/components/multi-platform-ai"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "多平台AI聊天 - AI助手",
  description: "一次提问，多个AI平台同时回答。支持ChatGPT、DeepSeek、GitHub Copilot等多种AI服务。",
  keywords: ["AI聊天", "多平台AI", "ChatGPT", "DeepSeek", "AI助手", "人工智能"],
}

export default function ChatPage() {
  return <MultiPlatformAI />
}
