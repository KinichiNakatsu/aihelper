// Test script for streaming API
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function testStreamingAPI() {
  console.log("🧪 Testing Streaming API...\n")

  const testPrompt = "How to create a React component?"
  const testServices = {
    chatgpt: true,
    deepseek: false,
    github: true,
    microsoft: false,
  }

  try {
    console.log("📤 Sending request...")
    console.log("Prompt:", testPrompt)
    console.log(
      "Services:",
      Object.keys(testServices)
        .filter((k) => testServices[k])
        .join(", "),
    )
    console.log("\n" + "=".repeat(50) + "\n")

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: testPrompt,
        selectedServices: testServices,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    console.log("✅ Connection established, streaming data...\n")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    const serviceResponses = new Map()

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
            console.log("\n🏁 Streaming completed!")
            return
          }

          try {
            const streamData = JSON.parse(data)

            if (streamData.error) {
              console.log(`❌ ${streamData.service}: ${streamData.error}`)
            } else if (streamData.done) {
              console.log(`✅ ${streamData.service}: Completed`)
            } else if (streamData.content) {
              if (!serviceResponses.has(streamData.service)) {
                console.log(`\n🤖 ${streamData.service}:`)
                serviceResponses.set(streamData.service, "")
              }
              process.stdout.write(streamData.content)
              serviceResponses.set(streamData.service, serviceResponses.get(streamData.service) + streamData.content)
            }
          } catch (e) {
            console.error("❌ Error parsing stream data:", e.message)
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message)
  }
}

// Run the test
testStreamingAPI()
