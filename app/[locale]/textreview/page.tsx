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
  imageId: string
  imageName: string
  language: string
  originalText: string
  correctedText: string
  suggestions: string
  status: "success" | "error"
}

interface MergedOCRResult {
  language: string
  originalText: string
  correctedText: string
  suggestions: string
  status: "success" | "error"
  imageCount: number
}

export default function TextReviewPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [results, setResults] = useState<OCRResult[]>([])
  const [mergedResult, setMergedResult] = useState<MergedOCRResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [mergeImages, setMergeImages] = useState(false)
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
    setResults((prev) => prev.filter((result) => result.imageId !== id))
  }

  const clearAllImages = () => {
    setImages([])
    setResults([])
    setMergedResult(null)
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

    if (mergeImages) {
      // Process as merged result
      const mockMergedResult: MergedOCRResult = {
        language: "混合语言",
        originalText: `这是从 ${images.length} 张图片中提取并合并的文本内容。按照上传顺序进行了整理和合并。

=== 图片 1: ${images[0]?.name} ===
作所のアドレスを性所を日本語に覚語したら助けありますか、地の中に頭い込められて、の場所が分からずで、助け災害が「地震」などの地震にを覚えてなくていいです。

=== 图片 2: ${images[1]?.name || "示例图片"} ===
被災して困った時にたまります。助けくれますか、道意車が呼ばれたとき警察守消防車が呼ばれたら、１１０番に連すたりします。１１９番に連絡しスタクにも救備を求められます。

=== 图片 3: ${images[2]?.name || "示例图片"} ===
困ったときに、の声に避難所の結論まとめ地震は予測できないから、日ごろの備えが大切です。

${images.length > 3 ? `\n=== 其他 ${images.length - 3} 张图片 ===\n更多文本内容...` : ""}`,
        correctedText: `这是经过AI修正后的合并文本内容。已经统一了语言风格，修正了错误，并优化了整体结构。

=== 第一部分：地址和位置信息 ===
工作场所的地址要用日语记住吗？如果有帮助的话，当地点被埋在废墟中，不知道具体位置时，对于"地震"等灾害，即使没有记住也没关系。

=== 第二部分：紧急救援 ===
遇到灾难困难的时候会有帮助。能帮助我吗？当救护车被叫来时，警察和消防车也会被叫来，拨打110或119进行联络。也可以向工作人员求助。

=== 第三部分：防灾准备 ===
遇到困难时，关于避难所的结论：地震是无法预测的，平时的准备很重要。

=== 总结 ===
所有图片的文本内容已经整合完毕，语言统一，逻辑清晰。`,
        suggestions: `合并处理建议：
1. 统一了混合语言文本，主要转换为中文表达
2. 按照逻辑顺序重新组织了内容结构
3. 修正了OCR识别错误和语法问题
4. 建议在实际应用中根据图片内容的相关性来决定是否合并处理
5. 对于不同主题的图片，建议分别处理以保持内容的独立性`,
        status: "success",
        imageCount: images.length,
      }

      setTimeout(() => {
        setMergedResult(mockMergedResult)
        setIsProcessing(false)
      }, 2500)
    } else {
      // Process individually
      const mockResults: OCRResult[] = images.map((image, index) => ({
        imageId: image.id,
        imageName: image.name,
        language: index === 0 ? "日文" : ["中文", "英文", "韩文"][Math.floor(Math.random() * 3)],
        originalText: `这是从图片 ${image.name} 中提取的原始文本。包含了各种文字内容，可能存在一些识别错误或格式问题。

例如：作所のアドレスを性所を日本語に覚語したら助けありますか、地の中に頭い込められて、の場所が分からずで、助け災害が「地震」などの地震にを覚えてなくていいです。

被災して困った時にたまります。助けくれますか、道意車が呼ばれたとき警察守消防車が呼ばれたら、１１０番に連すたりします。１１９番に連絡しスタクにも救備を求められます。

困ったときに、の声に避難所の結論まとめ地震は予測できないから、日ごろの備えが大切です。`,
        correctedText: `这是经过AI修正后的文本内容。语法更加准确，格式更加规范，错别字已经修正。

例如：作业所的地址要改成日语来记住吗，如果有帮助的话，地点被埋在其中，不知道场所在哪里，发生了"地震"等灾害时，如果没有记住是没关系的。

遇到灾难困难的时候会有帮助。能帮助我吗，当救急车被叫来的时候，警察和消防车也会被叫来，拨打110或119进行联络。向工作人员求助。

遇到困难的时候，避难所的结论：地震是无法预测的，平时的准备很重要。`,
        suggestions: `建议优化文本结构，注意标点符号的使用，保持语言的一致性和流畅性。对于混合语言文本，建议分别处理不同语言部分。`,
        status: "success",
      }))

      setTimeout(() => {
        setResults(mockResults)
        setIsProcessing(false)
      }, 2000)
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
                {mergedResult && (
                  <Badge variant="secondary" className="ml-2">
                    合并处理 ({mergedResult.imageCount} 张图片)
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
              ) : mergedResult ? (
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
                      <p className="text-sm text-gray-500">共处理 {mergedResult.imageCount} 张图片</p>
                    </div>
                    <Badge
                      variant={mergedResult.status === "success" ? "default" : "destructive"}
                      className="px-3 py-1"
                    >
                      {mergedResult.status === "success" ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          成功
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          失败
                        </>
                      )}
                    </Badge>
                  </div>

                  {mergedResult.status === "success" && (
                    <>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">语言:</label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {mergedResult.language}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">合并文本:</label>
                          <div className="p-4 bg-gray-50 rounded-lg h-80 overflow-y-auto border">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{mergedResult.originalText}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">修正后:</label>
                          <div className="p-4 bg-blue-50 rounded-lg h-80 overflow-y-auto border border-blue-200">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{mergedResult.correctedText}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">修正意见:</label>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{mergedResult.suggestions}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Individual Results Display
                results.map((result, index) => (
                  <div key={result.imageId} className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border">
                        <img
                          src={images.find((img) => img.id === result.imageId)?.preview || "/placeholder.svg"}
                          alt={result.imageName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">图片 {index + 1}</h3>
                        <p className="text-sm text-gray-500">{result.imageName}</p>
                      </div>
                      <Badge variant={result.status === "success" ? "default" : "destructive"} className="px-3 py-1">
                        {result.status === "success" ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            成功
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            失败
                          </>
                        )}
                      </Badge>
                    </div>

                    {result.status === "success" && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">语言:</label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                              {result.language}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">文本:</label>
                            <div className="p-4 bg-gray-50 rounded-lg h-64 overflow-y-auto border">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.originalText}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">修正后:</label>
                            <div className="p-4 bg-blue-50 rounded-lg h-64 overflow-y-auto border border-blue-200">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">修正意见:</label>
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.suggestions}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
