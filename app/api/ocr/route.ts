import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

const OCRResponseSchema = z.object({
  lang: z.string(),
  text: z.string(),
  advice: z.array(z.string()),
  text_refined: z.string(),
  return: z.literal("OK"),
  end: z.literal("end"),
})

const MergedOCRResponseSchema = z.object({
  lang: z.string(),
  text: z.string(),
  advice: z.array(z.string()),
  text_refined: z.string(),
  return: z.literal("OK"),
  end: z.literal("end"),
  image_count: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const mergeImages = formData.get("mergeImages") === "true"
    const images: File[] = []

    // Extract all image files from FormData
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image_") && value instanceof File) {
        images.push(value)
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    // Convert images to base64
    const imagePromises = images.map(async (image) => {
      const bytes = await image.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      return {
        type: "image" as const,
        image: `data:${image.type};base64,${base64}`,
      }
    })

    const imageContents = await Promise.all(imagePromises)

    const prompt = `
    提取图片中的文字，不需要自动翻译。
    以识别出的语言为基础，针对单词，语法提出修改意见
    并且根据修改意见对这段文章进行修改。
    返回JSON格式：
    - lang：检测出的语言
    - text：提取的文字
    - advice：返回数组，每条建议单独作为一个字符串元素
    - text_refined：修改后的文章
    - return"OK"
    - end：固定为"end"

    示例：
    {
      "lang": "日文",
      "text": "...",
      "advice": [
        "1. 建议1",
        "2. 建议2",
        "3. ..."
      ],
      "text_refined": "...",
      "return": "OK",
      "end": "end"
    } 
    不需要开头的\`\`\`json
    不需要结尾的\`\`\`
    ${mergeImages ? `\n请将所有图片的内容合并处理，按顺序整理文本。` : ""}
    `

    if (mergeImages) {
      // Process all images as one merged result
      const result = await generateObject({
        model: openai("gpt-4o"),
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }, ...imageContents],
          },
        ],
        schema: MergedOCRResponseSchema,
      })

      return NextResponse.json({
        success: true,
        merged: true,
        result: {
          ...result.object,
          image_count: images.length,
        },
      })
    } else {
      // Process each image individually
      const results = await Promise.all(
        imageContents.map(async (imageContent, index) => {
          try {
            const result = await generateObject({
              model: openai("gpt-4o"),
              messages: [
                {
                  role: "user",
                  content: [{ type: "text", text: prompt }, imageContent],
                },
              ],
              schema: OCRResponseSchema,
            })

            return {
              imageIndex: index,
              imageName: images[index].name,
              success: true,
              result: result.object,
            }
          } catch (error) {
            console.error(`Error processing image ${index}:`, error)
            return {
              imageIndex: index,
              imageName: images[index].name,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            }
          }
        }),
      )

      return NextResponse.json({
        success: true,
        merged: false,
        results,
      })
    }
  } catch (error) {
    console.error("OCR API Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
