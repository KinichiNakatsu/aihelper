import type { NextRequest } from "next/server"

interface ChatRequest {
  prompt: string
  selectedServices: {
    chatgpt: boolean
    deepseek: boolean
    github: boolean
    microsoft: boolean
  }
}

interface StreamResponse {
  service: string
  content: string
  done: boolean
  error?: string
  timestamp: number
}

// OpenAI Streaming
async function* streamOpenAI(prompt: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body")
    }

    let buffer = ""
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
            yield { service: "ChatGPT", content: "", done: true, timestamp: Date.now() }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ""
            if (content) {
              yield { service: "ChatGPT", content, done: false, timestamp: Date.now() }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    yield {
      service: "ChatGPT",
      content: "",
      done: true,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    }
  }
}

// DeepSeek Streaming
async function* streamDeepSeek(prompt: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("No response body")
    }

    let buffer = ""
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
            yield { service: "DeepSeek", content: "", done: true, timestamp: Date.now() }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ""
            if (content) {
              yield { service: "DeepSeek", content, done: false, timestamp: Date.now() }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    yield {
      service: "DeepSeek",
      content: "",
      done: true,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    }
  }
}

// GitHub Copilot Streaming (Enhanced with real API integration)
async function* streamGitHubCopilot(prompt: string) {
  try {
    const githubToken = process.env.GITHUB_TOKEN
    const githubApiUrl = process.env.GITHUB_API_URL || "https://api.github.com"

    // Initial status message
    yield {
      service: "GitHub Copilot",
      content: "🔍 正在分析您的问题...\n\n",
      done: false,
      timestamp: Date.now(),
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!githubToken) {
      yield {
        service: "GitHub Copilot",
        content: "⚠️ GitHub Token未配置，使用模拟模式\n\n",
        done: false,
        timestamp: Date.now(),
      }

      // Stream the simulation response
      const simulationResponse = await simulateGitHubCopilotStreaming(prompt)
      for (const chunk of simulationResponse) {
        yield chunk
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      return
    }

    // Real GitHub API integration
    yield {
      service: "GitHub Copilot",
      content: "🔗 正在搜索GitHub代码库...\n\n",
      done: false,
      timestamp: Date.now(),
    }

    try {
      const searchResponse = await fetch(
        `${githubApiUrl}/search/code?q=${encodeURIComponent(prompt)}&sort=indexed&order=desc&per_page=5`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Multi-Platform-AI-App",
          },
        },
      )

      if (!searchResponse.ok) {
        throw new Error(`GitHub API error: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()

      yield {
        service: "GitHub Copilot",
        content: `📊 找到 ${searchData.total_count} 个相关结果\n\n`,
        done: false,
        timestamp: Date.now(),
      }

      await new Promise((resolve) => setTimeout(resolve, 300))

      if (searchData.items && searchData.items.length > 0) {
        yield {
          service: "GitHub Copilot",
          content: "📋 **相关代码示例:**\n\n",
          done: false,
          timestamp: Date.now(),
        }

        for (let i = 0; i < Math.min(3, searchData.items.length); i++) {
          const item = searchData.items[i]
          yield {
            service: "GitHub Copilot",
            content: `${i + 1}. **${item.name}** (${item.repository.full_name})\n   📝 语言: ${item.repository.language || "Unknown"}\n   📁 路径: ${item.path}\n\n`,
            done: false,
            timestamp: Date.now(),
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        yield {
          service: "GitHub Copilot",
          content: "💡 **编程建议:**\n\n",
          done: false,
          timestamp: Date.now(),
        }

        const suggestions = [
          "• 查看上述代码示例以获取实现思路",
          "• 考虑代码的可读性和维护性",
          "• 遵循所选编程语言的最佳实践",
          "• 添加适当的错误处理和测试",
          "• 使用版本控制管理代码变更",
        ]

        for (const suggestion of suggestions) {
          yield {
            service: "GitHub Copilot",
            content: suggestion + "\n",
            done: false,
            timestamp: Date.now(),
          }
          await new Promise((resolve) => setTimeout(resolve, 150))
        }
      } else {
        yield {
          service: "GitHub Copilot",
          content:
            "💡 **通用编程建议:**\n\n• 使用清晰的变量和函数命名\n• 编写模块化和可重用的代码\n• 添加注释说明复杂逻辑\n• 考虑性能和安全性\n• 编写单元测试确保代码质量\n\n",
          done: false,
          timestamp: Date.now(),
        }
      }

      yield {
        service: "GitHub Copilot",
        content: `\n🔗 **更多资源:**\n• [搜索更多示例](https://github.com/search?q=${encodeURIComponent(prompt)}&type=code)\n• [GitHub文档](https://docs.github.com)\n• [GitHub社区](https://github.community)\n`,
        done: false,
        timestamp: Date.now(),
      }
    } catch (apiError) {
      yield {
        service: "GitHub Copilot",
        content: `❌ API调用失败: ${apiError instanceof Error ? apiError.message : "Unknown error"}\n\n正在切换到模拟模式...\n\n`,
        done: false,
        timestamp: Date.now(),
      }

      // Fallback to simulation
      const simulationResponse = await simulateGitHubCopilotStreaming(prompt)
      for (const chunk of simulationResponse) {
        yield chunk
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    yield { service: "GitHub Copilot", content: "", done: true, timestamp: Date.now() }
  } catch (error) {
    yield {
      service: "GitHub Copilot",
      content: "",
      done: true,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    }
  }
}

// Simulation function for streaming
async function simulateGitHubCopilotStreaming(prompt: string) {
  const chunks = [
    "🤖 **GitHub Copilot 智能分析**\n\n",
    `针对您的问题 "${prompt}"，我提供以下建议：\n\n`,
    "🔧 **代码实现建议:**\n",
    "• 选择合适的编程语言和框架\n",
    "• 设计清晰的代码架构\n",
    "• 实现错误处理机制\n",
    "• 编写可维护的代码\n\n",
    "🛠 **开发最佳实践:**\n",
    "• 版本控制: 使用Git进行代码管理\n",
    "• 代码审查: 通过Pull Request进行协作\n",
    "• 测试驱动: 编写单元测试和集成测试\n",
    "• 文档编写: 维护清晰的项目文档\n",
    "• 持续集成: 设置CI/CD流水线\n\n",
    "📚 **学习资源:**\n",
    "• GitHub: 探索开源项目和代码示例\n",
    "• Stack Overflow: 寻找技术问题解答\n",
    "• 官方文档: 查阅相关技术的官方指南\n",
    "• 在线教程: 通过实践项目提升技能\n\n",
    "⚠️ **注意:** 这是模拟响应。要使用真实的GitHub API，请配置GITHUB_TOKEN环境变量。",
  ]

  return chunks.map((content) => ({
    service: "GitHub Copilot",
    content,
    done: false,
    timestamp: Date.now(),
  }))
}

// Microsoft Copilot Streaming (Simulated)
async function* streamMicrosoftCopilot(prompt: string) {
  try {
    const fullResponse = `Microsoft Copilot 流式回复: 针对您的问题 "${prompt}"，我提供以下建议：

• 综合分析您的需求
• 提供多角度的解决方案
• 考虑实际应用场景
• 给出具体的实施步骤

这是一个模拟的流式响应，实际的 Microsoft Copilot 会基于您的具体需求提供更详细的帮助。`

    const words = fullResponse.split("")
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 25 + Math.random() * 25))
      yield {
        service: "Microsoft Copilot",
        content: words[i],
        done: false,
        timestamp: Date.now(),
      }
    }

    yield { service: "Microsoft Copilot", content: "", done: true, timestamp: Date.now() }
  } catch (error) {
    yield {
      service: "Microsoft Copilot",
      content: "",
      done: true,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { prompt, selectedServices } = body

    if (!prompt || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        // Create generators for selected services
        const generators: AsyncGenerator<StreamResponse>[] = []

        if (selectedServices.chatgpt) {
          generators.push(streamOpenAI(prompt))
        }
        if (selectedServices.deepseek) {
          generators.push(streamDeepSeek(prompt))
        }
        if (selectedServices.github) {
          generators.push(streamGitHubCopilot(prompt))
        }
        if (selectedServices.microsoft) {
          generators.push(streamMicrosoftCopilot(prompt))
        }

        // Process all generators concurrently
        const activeGenerators = new Map(generators.map((gen, index) => [index, gen]))

        while (activeGenerators.size > 0) {
          const promises = Array.from(activeGenerators.entries()).map(async ([index, generator]) => {
            try {
              const result = await generator.next()
              return { index, result: result.value, done: result.done }
            } catch (error) {
              return {
                index,
                result: {
                  service: "Unknown",
                  content: "",
                  done: true,
                  error: error instanceof Error ? error.message : "Unknown error",
                  timestamp: Date.now(),
                },
                done: true,
              }
            }
          })

          const results = await Promise.allSettled(promises)

          for (const promiseResult of results) {
            if (promiseResult.status === "fulfilled") {
              const { index, result, done } = promiseResult.value

              if (result) {
                // Send the chunk
                const chunk = `data: ${JSON.stringify(result)}\n\n`
                controller.enqueue(encoder.encode(chunk))
              }

              if (done) {
                activeGenerators.delete(index)
              }
            }
          }

          // Small delay to prevent overwhelming the client
          await new Promise((resolve) => setTimeout(resolve, 10))
        }

        // Send completion signal
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Streaming API Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
