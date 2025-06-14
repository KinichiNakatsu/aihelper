// Performance testing for streaming
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function performanceTest() {
  console.log("⚡ Performance Testing Streaming API...\n")

  const testCases = [
    {
      name: "Single Service",
      services: { chatgpt: true, deepseek: false, github: false, microsoft: false },
      prompt: "Short test prompt",
    },
    {
      name: "Two Services",
      services: { chatgpt: true, deepseek: false, github: true, microsoft: false },
      prompt: "Medium length test prompt for performance testing",
    },
    {
      name: "All Services",
      services: { chatgpt: true, deepseek: true, github: true, microsoft: true },
      prompt: "Long test prompt to evaluate performance with multiple services running concurrently",
    },
  ]

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`)
    console.log("-".repeat(30))

    const startTime = Date.now()
    let firstResponseTime = null
    let totalChunks = 0
    let totalBytes = 0

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
          selectedServices: testCase.services,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        totalBytes += value.length
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            totalChunks++
            if (firstResponseTime === null) {
              firstResponseTime = Date.now() - startTime
            }

            const data = line.slice(6)
            if (data === "[DONE]") {
              const totalTime = Date.now() - startTime

              console.log(`⏱️  First response: ${firstResponseTime}ms`)
              console.log(`⏱️  Total time: ${totalTime}ms`)
              console.log(`📦 Total chunks: ${totalChunks}`)
              console.log(`📊 Total bytes: ${totalBytes}`)
              console.log(`🚀 Avg chunk time: ${(totalTime / totalChunks).toFixed(2)}ms`)

              break
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ ${testCase.name} failed:`, error.message)
    }
  }

  console.log("\n🏁 Performance testing completed!")
}

// Run performance test
performanceTest()
