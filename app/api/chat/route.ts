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

// GitHub Copilot simulation (as it doesn't have a public API)
async function callGitHubCopilot(prompt: string): Promise<string> {
  // Simulate GitHub Copilot response
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  return `GitHub Copilot 分析: 基于您的问题 "${prompt}"，我建议您考虑以下几个方面：

1. 代码实现的最佳实践
2. 性能优化建议
3. 安全性考虑
4. 可维护性改进

这是一个模拟响应，实际的 GitHub Copilot 会提供更具体的代码建议和解决方案。`
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
