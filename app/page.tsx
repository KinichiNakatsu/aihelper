"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, X, GripVertical, FileText, Languages, CheckCircle, AlertCircle } from "lucide-react"
import Image from "next/image"

interface UploadedImage {
  id: string
  file: File
  preview: string
  name: string
  size: number
}

interface OCRResult {
  imageId: string
  imageName: string
  language: string
  originalText: string
  correctedText: string
  suggestions: string
  status: "success" | "error"
  error?: string
}

export default function OCRPage() {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [results, setResults] = useState<OCRResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [dragOver, setDragOver] = useState(false)

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
    addImages(files)
  }

  const addImages = (files: File[]) => {
    const newImages = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id)
      const imageToRemove = prev.find((img) => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return updated
    })
  }

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview))
    setImages([])
    setResults([])
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setImages(newImages)
  }

  const processWithOpenAI = async () => {
    if (images.length === 0) return

    setIsProcessing(true)
    setActiveTab("results")

    try {
      // Simulate API processing
      const mockResults: OCRResult[] = images.map((image, index) => ({
        imageId: image.id,
        imageName: image.name,
        language: index === 0 ? "日文" : ["中文", "英文", "韩文"][Math.floor(Math.random() * 3)],
        originalText: `这是从图片 ${image.name} 中提取的原始文本。包含了各种文字内容，可能存在一些识别错误或格式问题。文本内容较长，包含多个段落和句子。例如，作所のアドレスを性所を日本語に覚語したら助けありますか、地の中に頭い込められて、の場所が分からずで、助け災害が「地震」などの地震にを覚えてなくていいです。被災して困った時にたまります。助けくれますか、道意車が呼ばれたとき警察守消防車が呼ばれたら、１１０番に連すたりします。１１９番に連絡しスタクにも救備を求められます。困ったときに、の声に避難所の結論まとめ地震は予測できないから、日ごろの備えが大切です。`,
        correctedText: `这是经过AI修正后的文本内容。语法更加准确，格式更加规范，错别字已经修正。文本结构更加清晰，便于阅读和理解。例如：作业所的地址要改成日语来记住吗，如果有帮助的话，地点被埋在其中，不知道场所在哪里，发生了"地震"等灾害时，如果没有记住是没关系的。遇到灾难困难的时候会有帮助。能帮助我吗，当救急车被叫来的时候，警察和消防车也会被叫来，拨打110或119进行联络。向工作人员求助。遇到困难的时候，避难所的结论：地震是无法预测的，平时的准备很重要。`,
        suggestions: `建议优化文本结构，注意标点符号的使用，保持语言的一致性和流畅性。对于混合语言文本，建议分别处理不同语言部分。`,
        status: "success",
      }))

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setResults(mockResults)
    } catch (error) {
      console.error("OCR processing failed:", error)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI文章修改，支持多图片上传，<span className="text-red-500">OCR文本提取</span>
          </h1>
          <p className="text-gray-600 text-lg">
            上传多张包含文本的图片，调整顺序后提交，OpenAI将自动识别文字并返回结果
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              图片上传
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              润色结果
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Area */}
            <Card>
              <CardContent className="p-8">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Upload className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {dragOver ? "松开鼠标上传文件" : "拖放图片到此处或"}
                  </p>
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="mb-4 cursor-pointer">
                      选择图片
                    </Button>
                  </label>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", index.toString())
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
                          if (fromIndex !== index) {
                            moveImage(fromIndex, index)
                          }
                        }}
                      >
                        <div className="relative aspect-video">
                          <Image
                            src={image.preview || "/placeholder.svg"}
                            alt={image.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="absolute top-2 right-8 bg-gray-800 bg-opacity-50 text-white p-1 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <button
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3 bg-white">
                          <p className="font-medium text-sm truncate" title={image.name}>
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={processWithOpenAI}
                      disabled={isProcessing}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {images.length === 0 ? "请先上传图片" : '点击"调用OpenAI"开始处理'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    AI处理结果
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {results.map((result, index) => (
                    <div key={result.imageId} className="border rounded-lg p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <Image
                            src={
                              images.find((img) => img.id === result.imageId)?.preview ||
                              "/placeholder.svg?height=64&width=64"
                            }
                            alt={result.imageName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">图片 {index + 1}</h3>
                          <p className="text-sm text-gray-500">{result.imageName}</p>
                        </div>
                        <Badge variant={result.status === "success" ? "default" : "destructive"}>
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

                      {result.status === "success" ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">语言:</label>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <Badge variant="outline">{result.language}</Badge>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">文本:</label>
                              <div className="p-4 bg-gray-50 rounded-lg h-64 overflow-y-auto">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.originalText}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">修正后:</label>
                              <div className="p-4 bg-blue-50 rounded-lg h-64 overflow-y-auto">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.correctedText}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">修正意见:</label>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <p className="text-sm">{result.suggestions}</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-red-600 text-sm">{result.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
