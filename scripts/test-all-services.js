// Test all services individually
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function testService(serviceName, serviceKey) {
  console.log(`\n🧪 Testing ${serviceName}...`)
  console.log("=".repeat(40))

  const services = {
    chatgpt: false,
    deepseek: false,
    github: false,
    microsoft: false,
  }
  services[serviceKey] = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Test prompt for ${serviceName}`,
        selectedServices: services,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let hasContent = false

    const startTime = Date.now()

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
            const duration = Date.now() - startTime
            console.log(`\n⏱️  Duration: ${duration}ms`)
            console.log(`✅ ${serviceName} test completed`)
            return
          }

          try {
            const streamData = JSON.parse(data)

            if (streamData.error) {
              console.log(`❌ Error: ${streamData.error}`)
            } else if (streamData.content && !hasContent) {
              console.log("📝 First content received:")
              hasContent = true
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ ${serviceName} test failed:`, error.message)
  }
}

async function testAllServices() {
  console.log("🚀 Testing all services individually...\n")

  const services = [
    ["ChatGPT", "chatgpt"],
    ["DeepSeek", "deepseek"],
    ["GitHub Copilot", "github"],
    ["Microsoft Copilot", "microsoft"],
  ]

  for (const [name, key] of services) {
    await testService(name, key)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait between tests
  }

  console.log("\n🏁 All service tests completed!")
}

// Run all tests
testAllServices()
