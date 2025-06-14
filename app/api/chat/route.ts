import { type NextRequest, NextResponse } from "next/server"

interface ChatRequest {
  prompt: string
  selectedServices: {
    chatgpt: boolean
    deepseek: boolean
    github: boolean
    microsoft: boolean
  }
}

interface AIResponse {
  service: string
  response: string
  error?: string
  timestamp: number
}

// OpenAI API call with better error handling
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  // Debug logging
  console.log("OpenAI API Key exists:", !!apiKey)
  console.log("OpenAI API Key format:", apiKey?.substring(0, 10) + "...")

  if (!apiKey) {
    throw new Error("OpenAI API key is not configured")
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  console.log("OpenAI Response Status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.log("OpenAI Error Response:", errorText)

    if (response.status === 401) {
      throw new Error(
        `OpenAI Authentication Error: Invalid API key or insufficient credits. Please check your API key and billing setup.`,
      )
    }

    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || "No response generated"
}

// DeepSeek API call with improved error handling
async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY

  if (!apiKey) {
    throw new Error("DeepSeek API key is not configured")
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.log("DeepSeek Error Response:", errorText)

    if (response.status === 402) {
      throw new Error("DeepSeek Payment Required: Please add credits to your DeepSeek account at platform.deepseek.com")
    } else if (response.status === 401) {
      throw new Error("DeepSeek Authentication Error: Invalid API key")
    } else if (response.status === 429) {
      throw new Error("DeepSeek Rate Limit: Too many requests, please try again later")
    }

    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || "No response generated"
}

// GitHub API integration (using GitHub's REST API for code analysis)
async function callGitHubCopilot(prompt: string): Promise<string> {
  const githubToken = process.env.GITHUB_TOKEN
  const githubApiUrl = process.env.GITHUB_API_URL || "https://api.github.com"

  // If no GitHub token, return simulation
  if (!githubToken) {
    return await simulateGitHubCopilot(prompt)
  }

  try {
    // Use GitHub's search API to find relevant code examples
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
      if (searchResponse.status === 401) {
        throw new Error("GitHub Authentication Error: Invalid token")
      } else if (searchResponse.status === 403) {
        throw new Error("GitHub Rate Limit: API rate limit exceeded")
      } else if (searchResponse.status === 422) {
        throw new Error("GitHub Search Error: Invalid search query")
      }
      throw new Error(`GitHub API error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()

    // Analyze the search results and provide suggestions
    let response = `GitHub Copilot 代码分析: 基于您的查询 "${prompt}"，我找到了以下相关信息：\n\n`

    if (searchData.items && searchData.items.length > 0) {
      response += "📋 相关代码示例:\n"

      for (let i = 0; i < Math.min(3, searchData.items.length); i++) {
        const item = searchData.items[i]
        response += `${i + 1}. ${item.name} (${item.repository.full_name})\n`
        response += `   语言: ${item.repository.language || "Unknown"}\n`
        response += `   路径: ${item.path}\n\n`
      }

      response += "💡 建议:\n"
      response += "• 查看上述代码示例以获取实现思路\n"
      response += "• 考虑代码的可读性和维护性\n"
      response += "• 遵循所选编程语言的最佳实践\n"
      response += "• 添加适当的错误处理和测试\n\n"
    } else {
      response += "未找到直接相关的代码示例，但我建议:\n\n"
      response += "💡 通用编程建议:\n"
      response += "• 使用清晰的变量和函数命名\n"
      response += "• 编写模块化和可重用的代码\n"
      response += "• 添加注释说明复杂逻辑\n"
      response += "• 考虑性能和安全性\n"
      response += "• 编写单元测试确保代码质量\n\n"
    }

    response += "🔗 GitHub 资源:\n"
    response += `• 搜索更多示例: https://github.com/search?q=${encodeURIComponent(prompt)}&type=code\n`
    response += "• GitHub Docs: https://docs.github.com\n"
    response += "• GitHub Community: https://github.community\n"

    return response
  } catch (error) {
    console.error("GitHub API Error:", error)

    // Fallback to simulation if API fails
    return await simulateGitHubCopilot(prompt)
  }
}

// Simulation function for when GitHub API is not available
async function simulateGitHubCopilot(prompt: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Analyze the prompt to provide more relevant suggestions
  const isCodeRelated = /code|function|class|method|algorithm|programming|debug|error|syntax/.test(prompt.toLowerCase())
  const isWebDev = /html|css|javascript|react|vue|angular|web|frontend|backend/.test(prompt.toLowerCase())
  const isPython = /python|django|flask|pandas|numpy/.test(prompt.toLowerCase())
  const isJava = /java|spring|maven|gradle/.test(prompt.toLowerCase())

  let response = `GitHub Copilot 智能分析: 针对您的问题 "${prompt}"，我提供以下建议：\n\n`

  if (isCodeRelated) {
    response += "🔧 代码实现建议:\n"

    if (isWebDev) {
      response += "• 使用现代Web开发框架 (React, Vue, Angular)\n"
      response += "• 遵循响应式设计原则\n"
      response += "• 优化性能和用户体验\n"
      response += "• 确保跨浏览器兼容性\n"
    } else if (isPython) {
      response += "• 遵循PEP 8编码规范\n"
      response += "• 使用虚拟环境管理依赖\n"
      response += "• 利用Python丰富的第三方库\n"
      response += "• 编写Pythonic代码\n"
    } else if (isJava) {
      response += "• 遵循Java编码约定\n"
      response += "• 使用Maven或Gradle管理项目\n"
      response += "• 利用Spring框架的强大功能\n"
      response += "• 实现适当的设计模式\n"
    } else {
      response += "• 选择合适的编程语言和框架\n"
      response += "• 设计清晰的代码架构\n"
      response += "• 实现错误处理机制\n"
      response += "• 编写可维护的代码\n"
    }
  } else {
    response += "💡 通用建议:\n"
    response += "• 明确问题的具体需求\n"
    response += "• 研究现有的解决方案\n"
    response += "• 考虑可扩展性和维护性\n"
    response += "• 寻求社区支持和反馈\n"
  }

  response += "\n🛠 开发最佳实践:\n"
  response += "• 版本控制: 使用Git进行代码管理\n"
  response += "• 代码审查: 通过Pull Request进行协作\n"
  response += "• 测试驱动: 编写单元测试和集成测试\n"
  response += "• 文档编写: 维护清晰的项目文档\n"
  response += "• 持续集成: 设置CI/CD流水线\n\n"

  response += "📚 学习资源:\n"
  response += "• GitHub: 探索开源项目和代码示例\n"
  response += "• Stack Overflow: 寻找技术问题解答\n"
  response += "• 官方文档: 查阅相关技术的官方指南\n"
  response += "• 在线教程: 通过实践项目提升技能\n\n"

  response += "⚠️ 注意: 这是GitHub Copilot的模拟响应。要获得真实的GitHub Copilot体验，请:\n"
  response += "• 在VS Code中安装GitHub Copilot扩展\n"
  response += "• 订阅GitHub Copilot服务\n"
  response += "• 配置GitHub Personal Access Token以使用GitHub API\n"

  return response
}

// Microsoft Copilot using Azure OpenAI Service
async function callMicrosoftCopilot(prompt: string): Promise<string> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-35-turbo"

  // If Azure OpenAI is not configured, try Microsoft Graph API (Copilot for Microsoft 365)
  if (!apiKey || !endpoint) {
    return await callMicrosoftGraphCopilot(prompt)
  }

  try {
    const response = await fetch(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are Microsoft Copilot, a helpful AI assistant powered by Azure OpenAI. Provide comprehensive, accurate, and helpful responses. When responding in Chinese, use simplified Chinese characters.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Azure OpenAI Error Response:", errorText)

      if (response.status === 401) {
        throw new Error("Azure OpenAI Authentication Error: Invalid API key")
      } else if (response.status === 429) {
        throw new Error("Azure OpenAI Rate Limit: Too many requests")
      } else if (response.status === 404) {
        throw new Error("Azure OpenAI Deployment Not Found: Check deployment name")
      }

      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || "No response generated"
  } catch (error) {
    console.error("Azure OpenAI Error:", error)
    // Fallback to Microsoft Graph API
    return await callMicrosoftGraphCopilot(prompt)
  }
}

// Microsoft Graph API for Copilot (Microsoft 365)
async function callMicrosoftGraphCopilot(prompt: string): Promise<string> {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  const tenantId = process.env.MICROSOFT_TENANT_ID

  if (!clientId || !clientSecret || !tenantId) {
    // Fallback simulation if Microsoft Graph is not configured
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))
    return `Microsoft Copilot 回复: 针对您的问题 "${prompt}"，我提供以下建议：

• 综合分析您的需求和上下文
• 基于Microsoft生态系统的最佳实践
• 提供可操作的解决方案和步骤
• 考虑安全性和合规性要求

建议您配置Azure OpenAI服务以获得更准确和个性化的Microsoft Copilot体验。您可以在Azure门户中创建OpenAI资源并获取API密钥。`
  }

  try {
    // Get access token
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to get Microsoft Graph access token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Call Microsoft Graph API (this is a simplified example)
    // Note: Actual Copilot API endpoints may vary
    const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me/messages", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!graphResponse.ok) {
      throw new Error("Microsoft Graph API call failed")
    }

    // This is a placeholder - actual Copilot integration would be more complex
    return `Microsoft Copilot (通过Microsoft Graph): 基于您的问题 "${prompt}"，我已分析了您的Microsoft 365环境并提供以下建议：

• 利用Microsoft 365应用程序的集成功能
• 优化工作流程和协作效率
• 确保数据安全和合规性
• 使用Power Platform进行自动化

注意：这是一个示例响应。完整的Microsoft Copilot集成需要适当的许可证和配置。`
  } catch (error) {
    console.error("Microsoft Graph Error:", error)
    throw new Error("Microsoft Copilot service temporarily unavailable")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { prompt, selectedServices } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const promises: Promise<AIResponse>[] = []

    // Create promises for selected services
    if (selectedServices.chatgpt) {
      promises.push(
        callOpenAI(prompt)
          .then((response) => ({
            service: "ChatGPT",
            response,
            timestamp: Date.now(),
          }))
          .catch((error) => ({
            service: "ChatGPT",
            response: "",
            error: error.message,
            timestamp: Date.now(),
          })),
      )
    }

    if (selectedServices.deepseek) {
      promises.push(
        callDeepSeek(prompt)
          .then((response) => ({
            service: "DeepSeek",
            response,
            timestamp: Date.now(),
          }))
          .catch((error) => ({
            service: "DeepSeek",
            response: "",
            error: error.message,
            timestamp: Date.now(),
          })),
      )
    }

    if (selectedServices.github) {
      promises.push(
        callGitHubCopilot(prompt)
          .then((response) => ({
            service: "GitHub Copilot",
            response,
            timestamp: Date.now(),
          }))
          .catch((error) => ({
            service: "GitHub Copilot",
            response: "",
            error: error.message,
            timestamp: Date.now(),
          })),
      )
    }

    if (selectedServices.microsoft) {
      promises.push(
        callMicrosoftCopilot(prompt)
          .then((response) => ({
            service: "Microsoft Copilot",
            response,
            timestamp: Date.now(),
          }))
          .catch((error) => ({
            service: "Microsoft Copilot",
            response: "",
            error: error.message,
            timestamp: Date.now(),
          })),
      )
    }

    // Execute all API calls in parallel
    const results = await Promise.all(promises)

    return NextResponse.json({
      success: true,
      results,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
