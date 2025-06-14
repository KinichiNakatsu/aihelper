"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Play, Square, RotateCcw, Activity } from "lucide-react"

interface StreamEvent {
  timestamp: number
  service: string
  content: string
  done: boolean
  error?: string
}

export default function StreamingDebug() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [testPrompt, setTestPrompt] = useState("How to create a React component?")
  const [selectedServices, setSelectedServices] = useState({
    chatgpt: true,
    deepseek: false,
    github: true,
    microsoft: false,
  })

  const startTest = async () => {
    setIsStreaming(true)
    setEvents([])

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: testPrompt,
          selectedServices,
        }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      if (!reader) return

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
              setIsStreaming(false)
              return
            }

            try {
              const streamData = JSON.parse(data)
              setEvents((prev) => [
                ...prev,
                {
                  timestamp: Date.now(),
                  service: streamData.service,
                  content: streamData.content || "",
                  done: streamData.done,
                  error: streamData.error,
                },
              ])
            } catch (e) {
              console.error("Parse error:", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error)
      setIsStreaming(false)
    }
  }

  const stopTest = () => {
    setIsStreaming(false)
  }

  const clearEvents = () => {
    setEvents([])
  }

  const serviceStats = events.reduce(
    (acc, event) => {
      if (!acc[event.service]) {
        acc[event.service] = { chunks: 0, chars: 0, errors: 0 }
      }
      acc[event.service].chunks++
      acc[event.service].chars += event.content.length
      if (event.error) acc[event.service].errors++
      return acc
    },
    {} as Record<string, { chunks: number; chars: number; errors: number }>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Streaming Debug Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Prompt</label>
            <Textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter test prompt..."
              className="min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Services to Test</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(selectedServices).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => setSelectedServices((prev) => ({ ...prev, [key]: checked }))}
                  />
                  <label className="capitalize">{key}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={startTest} disabled={isStreaming} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Test
            </Button>
            <Button
              onClick={stopTest}
              disabled={!isStreaming}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
            <Button onClick={clearEvents} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          </div>

          {Object.keys(serviceStats).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(serviceStats).map(([service, stats]) => (
                  <div key={service} className="p-2 bg-gray-50 rounded">
                    <div className="font-medium text-sm">{service}</div>
                    <div className="text-xs text-gray-600">
                      {stats.chunks} chunks, {stats.chars} chars
                      {stats.errors > 0 && <span className="text-red-500">, {stats.errors} errors</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stream Events ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {events.map((event, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm">
                <Badge variant={event.error ? "destructive" : event.done ? "default" : "secondary"}>
                  {event.service}
                </Badge>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
                  {event.error ? (
                    <div className="text-red-600">Error: {event.error}</div>
                  ) : event.done ? (
                    <div className="text-green-600">Completed</div>
                  ) : (
                    <div className="font-mono">{event.content || "(empty chunk)"}</div>
                  )}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center text-gray-500 py-8">No events yet. Start a test to see streaming data.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
