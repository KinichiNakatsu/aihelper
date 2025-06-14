"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSession, signIn } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Check, Sparkles, Send, AlertCircle, Loader2, Zap, Crown, Lock } from "lucide-react"
import LanguageSwitcher from "./language-switcher"
import SubscriptionDialog from "./subscription-dialog"

interface AIResponse {
  service: string
  response: string
  error?: string
  timestamp: number
}

interface StreamingResponse {
  service: string
  content: string
  done: boolean
  error?: string
  timestamp: number
}

interface ApiResponse {
  success: boolean
  results: AIResponse[]
  timestamp: number
  error?: string
}

// Define the service keys type
type ServiceKey = "chatgpt" | "deepseek" | "github" | "microsoft"

interface SelectedServices {
  chatgpt: boolean
  deepseek: boolean
  github: boolean
  microsoft: boolean
}

interface Service {
  key: ServiceKey
  name: string
  color: string
}

export default function MultiPlatformAI() {
  const t = useTranslations()
  const { data: session, status } = useSession()

  const [prompt, setPrompt] = useState("")
  const [selectedServices, setSelectedServices] = useState<SelectedServices>({
    chatgpt: true,
    deepseek: true,
    github: false,
    microsoft: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState<AIResponse[]>([])
  const [streamingResponses, setStreamingResponses] = useState<Map<string, string>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const services: Service[] = [
    { key: "chatgpt", name: "ChatGPT", color: "from-green-400 to-green-600" },
    { key: "deepseek", name: "DeepSeek", color: "from-purple-400 to-purple-600" },
    { key: "github", name: "GitHub Copilot", color: "from-gray-600 to-gray-800" },
    { key: "microsoft", name: "Microsoft Copilot", color: "from-blue-400 to-blue-600" },
  ]

  // Check subscription status when user is authenticated
  useEffect(() => {
    if (session?.user) {
      checkSubscriptionStatus()
    }
  }, [session])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const checkSubscriptionStatus = async () => {
    setCheckingSubscription(true)
    try {
      const response = await fetch("/api/subscription/status")
      const data = await response.json()
      setHasActiveSubscription(data.hasActiveSubscription)
    } catch (error) {
      console.error("Error checking subscription:", error)
    } finally {
      setCheckingSubscription(false)
    }
  }

  const toggleService = (serviceKey: ServiceKey) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }))
  }

  const handleStreamingToggle = (checked: boolean) => {
    if (checked && !session) {
      signIn()
      return
    }

    if (checked && !hasActiveSubscription) {
      // Don't toggle, let the subscription dialog handle it
      return
    }

    setIsStreaming(checked)
  }

  const handleStreamingSubmit = async () => {
    if (!prompt.trim()) return

    const selectedCount = Object.values(selectedServices).filter(Boolean).length
    if (selectedCount === 0) {
      setError("请至少选择一个AI服务")
      return
    }

    setIsLoading(true)
    setError(null)
    setStreamingResponses(new Map())
    setResponses([])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          selectedServices,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let buffer = ""
      const completedServices = new Set<string>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              setIsLoading(false)
              return
            }

            try {
              const streamData: StreamingResponse = JSON.parse(data)

              if (streamData.error) {
                setStreamingResponses((prev) => {
                  const newMap = new Map(prev)
                  newMap.set(streamData.service, `Error: ${streamData.error}`)
                  return newMap
                })
                completedServices.add(streamData.service)
              } else if (streamData.done) {
                completedServices.add(streamData.service)
              } else if (streamData.content) {
                setStreamingResponses((prev) => {
                  const newMap = new Map(prev)
                  const currentContent = newMap.get(streamData.service) || ""
                  newMap.set(streamData.service, currentContent + streamData.content)
                  return newMap
                })
              }
            } catch (e) {
              console.error("Error parsing streaming data:", e)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request cancelled")
      } else if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("网络错误，请检查网络连接")
      } else {
        setError(err instanceof Error ? err.message : "服务器错误")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStandardSubmit = async () => {
    if (!prompt.trim()) return

    const selectedCount = Object.values(selectedServices).filter(Boolean).length
    if (selectedCount === 0) {
      setError("请至少选择一个AI服务")
      return
    }

    setIsLoading(true)
    setError(null)
    setResponses([])
    setStreamingResponses(new Map())

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          selectedServices,
        }),
      })

      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "API错误")
      }

      if (data.success) {
        setResponses(data.results)
      } else {
        throw new Error(data.error || "服务器错误")
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("网络错误，请检查网络连接")
      } else {
        setError(err instanceof Error ? err.message : "服务器错误")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = () => {
    if (isStreaming) {
      handleStreamingSubmit()
    } else {
      handleStandardSubmit()
    }
  }

  const selectedCount = Object.values(selectedServices).filter(Boolean).length
  const completedCount = isStreaming ? streamingResponses.size : responses.length

  const canUseStreaming = session && hasActiveSubscription

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1" />
            <div className="flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-chinese">
                多平台 AI
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <LanguageSwitcher />
            </div>
          </div>
          <p className="text-gray-600 text-lg font-medium font-chinese">一次提问，多个AI平台同时回答</p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-chinese">输入您的问题</label>
                <Textarea
                  placeholder="请输入您想要询问的问题..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[140px] border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 focus:ring-4 resize-none text-gray-700 placeholder:text-gray-400 rounded-xl text-base leading-relaxed transition-all duration-200 font-chinese disabled:opacity-50"
                />
              </div>

              {/* Response Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isStreaming ? (
                      <Zap className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Send className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 font-chinese">
                          {isStreaming ? "流式响应" : "标准响应"}
                        </span>
                        {isStreaming && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                            <Crown className="w-3 h-3" />
                            <span>专业功能</span>
                          </div>
                        )}
                        {!canUseStreaming && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                            <Lock className="w-3 h-3" />
                            <span>需要订阅</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-chinese">
                        {isStreaming ? "实时显示AI回答过程" : "等待所有AI完成后显示结果"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!canUseStreaming && isStreaming && (
                    <SubscriptionDialog>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        升级
                      </Button>
                    </SubscriptionDialog>
                  )}
                  <Switch
                    checked={isStreaming}
                    onCheckedChange={handleStreamingToggle}
                    disabled={isLoading || checkingSubscription}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                  />
                </div>
              </div>

              {/* Submit Button and Progress */}
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isLoading || selectedCount === 0}
                  className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-chinese ${
                    isStreaming
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  } text-white`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isStreaming ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isLoading ? "提交中..." : "提交问题"}
                </Button>
                {isLoading && (
                  <div className="flex items-center gap-4 flex-1">
                    <Progress value={(completedCount / selectedCount) * 100} className="flex-1 h-3 bg-gray-200" />
                    <div
                      className={`flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-1 rounded-full font-chinese ${
                        isStreaming ? "bg-purple-50" : "bg-blue-50"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isStreaming ? "bg-purple-500" : "bg-blue-500"
                        }`}
                      ></div>
                      {completedCount}/{selectedCount} 已完成
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-chinese">{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 font-chinese">选择AI服务</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service) => (
              <button
                key={service.key}
                onClick={() => toggleService(service.key)}
                disabled={isLoading}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedServices[service.key]
                    ? "border-transparent shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${service.color} opacity-0 transition-opacity duration-200 ${
                    selectedServices[service.key] ? "opacity-100" : "group-hover:opacity-10"
                  }`}
                />
                <div className="relative flex items-center justify-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedServices[service.key] ? "border-white bg-white/20" : "border-gray-400"
                    }`}
                  >
                    {selectedServices[service.key] && <Check className="w-3 h-3 text-white font-bold" />}
                  </div>
                  <span
                    className={`font-semibold transition-colors duration-200 ${
                      selectedServices[service.key] ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {service.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Response Cards */}
        {(responses.length > 0 || streamingResponses.size > 0) && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 font-chinese">AI回答结果</h3>

            {/* Standard Responses */}
            {responses.map((aiResponse, index) => {
              const service = services.find((s) => s.name === aiResponse.service)
              return (
                <Card
                  key={`${aiResponse.service}-${index}`}
                  className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${service?.color || "from-gray-400 to-gray-600"}`}
                      />
                      <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {aiResponse.service}
                      </CardTitle>
                      <div className="ml-auto">
                        {aiResponse.error ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-[200px] pt-0">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      {aiResponse.error ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-chinese">错误: {aiResponse.error}</span>
                        </div>
                      ) : (
                        <div className="text-gray-700 leading-relaxed text-base font-chinese whitespace-pre-wrap">
                          {aiResponse.response || "暂无回答"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Streaming Responses */}
            {Array.from(streamingResponses.entries()).map(([serviceName, content]) => {
              const service = services.find((s) => s.name === serviceName)
              return (
                <Card
                  key={`streaming-${serviceName}`}
                  className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-gradient-to-r ${service?.color || "from-gray-400 to-gray-600"}`}
                      />
                      <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {serviceName}
                      </CardTitle>
                      <div className="ml-auto flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-500" />
                        {isLoading ? (
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="min-h-[200px] pt-0">
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <div className="text-gray-700 leading-relaxed text-base font-chinese whitespace-pre-wrap">
                        {content || "正在流式回答中..."}
                        {isLoading && <span className="animate-pulse">|</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Authentication Status */}
        {status === "loading" ? (
          <Card className="mt-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>检查登录状态...</span>
            </CardContent>
          </Card>
        ) : !session ? (
          <Card className="mt-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-gray-500" />
                <span className="text-lg font-semibold">登录以使用完整功能</span>
              </div>
              <p className="text-gray-600 mb-4">登录后可使用流式响应等专业功能</p>
              <Button onClick={() => signIn()} className="bg-blue-600 hover:bg-blue-700">
                立即登录
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
