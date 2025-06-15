"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Languages, CheckCircle, AlertCircle, ChevronUp, ChevronDown } from "lucide-react"

interface UploadedImage {
  id: string
  name: string
  size: number
  preview: string
  file: File
}

interface OCRResult {
  imageIndex: number
  imageName: string
  success: boolean
  result?: {
    lang: string
    text: string
    advice: string[]
    text_refined: string
    return: string
    end: string
  }
  error?: string
}

interface MergedOCRResult {
  success: boolean
  result?: {
    lang: string
    text: string
    advice: string[]
    text_refined: string
    return: string
    end: string
    image_count: number
  }
  error?: string
}

export default function TextReviewPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [results, setResults] = useState<OCRResult[]>([])
  const [mergedResult, setMergedResult] = useState<MergedOCRResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [mergeImages, setMergeImages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024,
    )

    if (files.length > 0) {
      addImages(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      addImages(files)
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const addImages = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          preview: e.target?.result as string,
          file: file,
        }
        setImages((prev) => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    setResults([])
    setMergedResult(null)
  }

  const clearAllImages = () => {
    setImages([])
    setResults([])
    setMergedResult(null)
    setError(null)
  }

  const moveImageUp = (index: number) => {
    if (index > 0) {
      const newImages = [...images]
      ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
      setImages(newImages)
    }
  }

  const moveImageDown = (index: number) => {
    if (index < images.length - 1) {
      const newImages = [...images]
      ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
      setImages(newImages)
    }
  }

  const processWithOpenAI = async () => {
    if (images.length === 0) return

    setIsProcessing(true)
    setResults([])
    setMergedResult(null)
    setError(null)

    try {
      // Prepare FormData
      const formData = new FormData()
      formData.append("mergeImages", mergeImages.toString())

      // Add images to FormData
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image.file)
      })

      console.log(`Processing ${images.length} images, merge: ${mergeImages}`)

      // Call the API
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("API Response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to process images")
      }

      if (!data.success) {
        throw new Error(data.error || "Processing failed")
      }

      if (data.merged) {
        // Handle merged result
        console.log("Setting merged result:", data)
        setMergedResult(data)
      } else {
        // Handle individual results
        console.log("Setting individual results:", data.results)
        setResults(data.results || [])
      }
    } catch (error) {
      console.error("Error processing images:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to process images"
      setError(errorMessage)

      // Show more detailed error for debugging
      if (error instanceof Error && error.message.includes("schema")) {
        setError(`Schema validation error: ${error.message}. Please try again or contact support.`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI文章修改，支持多图片上传，<span className="text-red-500">OCR文本提取</span>
          </h1>
          <p className="text-gray-600 text-lg">
            上传多张包含文本的图片，调整顺序后提交，OpenAI将自动识别文字并返回结果
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">处理错误</p>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setError(null)} className="mt-2">
                关闭
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <div className="space-y-6">
          {/* Upload Area */}
          <Card>
            <CardContent className="p-8">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleButtonClick}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-purple-500 bg-purple-50 scale-105"
                    : "border-gray-300 hover:border-purple-400 hover:bg-gray-50 hover:scale-102"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload
                  className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                    dragOver ? "text-purple-600" : "text-purple-500"
                  }`}
                />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {dragOver ? "松开鼠标上传文件" : "拖放图片到此处或"}
                </p>
                <Button
                  variant="outline"
                  className="mb-4 bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleButtonClick()
                  }}
                >
                  选择图片
                </Button>
                <p className="text-sm text-gray-500">支持格式：JPG, PNG (最大10MB)</p>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Images */}
          {images.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  已上传图片 ({images.length})<Badge variant="secondary">拖拽图片可调整顺序</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearAllImages}>
                  <X className="w-4 h-4 mr-2" />
                  清除所有
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className="flex items-center gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0">
                        <Badge
                          variant="outline"
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                        >
                          {index + 1}
                        </Badge>
                      </div>

                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
                        <img
                          src={image.preview || "/placeholder.svg"}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={image.name}>
                          {image.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          className="hover:bg-blue-50"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveImageDown(index)}
                          disabled={index === images.length - 1}
                          className="hover:bg-blue-50"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center items-center gap-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="merge-images"
                      checked={mergeImages}
                      onCheckedChange={(checked) => setMergeImages(checked as boolean)}
                    />
                    <label
                      htmlFor="merge-images"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      合并图像
                    </label>
                  </div>
                  <Button
                    onClick={processWithOpenAI}
                    disabled={isProcessing}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 px-8 py-3 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        处理中...
                      </>
                    ) : (
                      "调用OpenAI"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        {(results.length > 0 || mergedResult || isProcessing) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                AI处理结果
                {mergedResult?.result && (
                  <Badge variant="secondary" className="ml-2">
                    合并处理 ({mergedResult.result.image_count} 张图片)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isProcessing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    {mergeImages ? "正在合并处理所有图片..." : "正在处理图片，请稍候..."}
                  </p>
                </div>
              ) : mergedResult?.result ? (
                // Merged Result Display
                <div className="border rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-2">
                      {images.slice(0, 3).map((image, index) => (
                        <div
                          key={image.id}
                          className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border-2 border-white"
                        >
                          <img
                            src={image.preview || "/placeholder.svg"}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {images.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium">+{images.length - 3}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">合并处理结果</h3>
                      <p className="text-sm text-gray-500">共处理 {mergedResult.result.image_count} 张图片</p>
                    </div>
                    <Badge variant="default" className="px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {mergedResult.result.return}
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">检测语言:</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {mergedResult.result.lang}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">提取的文本:</label>
                      <div className="p-4 bg-gray-50 rounded-lg h-full overflow-y-auto border">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{mergedResult.result.text}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">修正后的文本:</label>
                      <div className="p-4 bg-blue-50 rounded-lg h-full overflow-y-auto border border-blue-200">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {mergedResult.result.text_refined}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">修改建议:</label>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <ul className="text-sm space-y-1">
                        {mergedResult.result.advice.map((advice, index) => (
                          <li key={index} className="leading-relaxed">
                            {advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                // Individual Results Display
                results.map((result, index) => (
                  <div key={`${result.imageIndex}-${index}`} className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                        <img
                          src={images[result.imageIndex]?.preview || "/placeholder.svg"}
                          alt={result.imageName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">图片 {result.imageIndex + 1}</h3>
                        <p className="text-sm text-gray-500">{result.imageName}</p>
                      </div>
                      <Badge variant={result.success ? "default" : "destructive"} className="px-3 py-1">
                        {result.success ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {result.result?.return || "成功"}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            失败
                          </>
                        )}
                      </Badge>
                    </div>

                    {result.success && result.result ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">检测语言:</label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {result.result.lang}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">提取的文本:</label>
                            <div className="p-4 bg-gray-50 rounded-lg h-64 overflow-y-auto border">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.result.text}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">修正后的文本:</label>
                            <div className="p-4 bg-blue-50 rounded-lg h-64 overflow-y-auto border border-blue-200">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {result.result.text_refined}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">修改建议:</label>
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <ul className="text-sm space-y-1">
                              {result.result.advice.map((advice, adviceIndex) => (
                                <li key={adviceIndex} className="leading-relaxed">
                                  {advice}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 text-sm">处理失败: {result.error || "未知错误"}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Tutorial Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              使用教程
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-gray-600">以下是详细的使用步骤，帮助您更好地使用OCR文本提取功能</p>
            </div>

          <div className="grid grid-cols-1 gap-8">
              {/* Tutorial Step 1 */}
              <div className="space-y-4">
                <div className="text-center">
                  <Badge variant="outline" className="mb-3 px-4 py-2 text-lg font-semibold">
                    步骤 1: 上传图片
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img src="/tutorial-step-1.png" alt="教程步骤1 - 上传图片" className="w-full h-64 object-cover" />
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">上传和排序图片</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 拖拽图片到上传区域或点击选择图片</li>
                    <li>• 支持JPG、PNG格式，最大10MB</li>
                    <li>• 使用上下箭头调整图片顺序</li>
                    <li>• 可以删除不需要的图片</li>
                  </ul>
                </div>
              </div>

              {/* Tutorial Step 2 */}
              <div className="space-y-4">
                <div className="text-center">
                  <Badge variant="outline" className="mb-3 px-4 py-2 text-lg font-semibold">
                    步骤 2: 处理选项
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <img src="/tutorial-step-2.png" alt="教程步骤2 - 处理选项" className="w-full h-64 object-cover" />
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">选择处理方式</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>
                      • <strong>单独处理</strong>：每张图片独立识别文字
                    </li>
                    <li>
                      • <strong>合并处理</strong>：将所有图片文字合并为一篇文章
                    </li>
                    <li>• 点击"调用OpenAI"开始处理</li>
                    <li>• 等待AI分析和文字提取完成</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                使用提示
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
                <div>
                  <h4 className="font-medium mb-2">图片质量建议：</h4>
                  <ul className="space-y-1">
                    <li>• 确保文字清晰可见</li>
                    <li>• 避免模糊或倾斜的图片</li>
                    <li>• 光线充足，对比度良好</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">处理结果：</h4>
                  <ul className="space-y-1">
                    <li>• 自动检测文字语言</li>
                    <li>• 提供原始和修正文本</li>
                    <li>• 给出改进建议</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
