"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import { useToast } from "@/hooks/use-toast"

const TextReviewPage = () => {
  const t = useTranslations("TextReviewPage")
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [results, setResults] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedImages((prevImages) => [...prevImages, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".gif", ".svg"],
    },
    multiple: true,
  })

  const removeImage = (index: number) => {
    setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index))
    setResults((prevResults) => prevResults.filter((_, i) => i !== index))
  }

  const processWithOpenAI = async () => {
    setIsProcessing(true)

    // 显示提交成功提示
    toast({
      title: "提交成功",
      description: `正在处理 ${uploadedImages.length} 张图片...`,
      duration: 3000,
    })

    try {
      const formData = new FormData()
      uploadedImages.forEach((image) => {
        formData.append("images", image)
      })

      const response = await fetch("/api/openai", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results)
      toast({
        title: "处理完成",
        description: `成功处理了 ${results.length} 张图片`,
        duration: 3000,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "处理失败",
        description: error instanceof Error ? error.message : "处理过程中发生错误",
        duration: 5000,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-6">{t("title")}</h1>

      <div
        {...getRootProps()}
        className="dropzone border-2 border-dashed rounded-md p-6 text-center cursor-pointer mb-4"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-gray-600">{t("dropActive")}</p>
        ) : (
          <p className="text-gray-600">{t("dropInactive")}</p>
        )}
      </div>

      <div className="flex flex-wrap -mx-2 mb-4">
        {uploadedImages.map((image, index) => (
          <div key={index} className="w-1/3 px-2 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("image")} {index + 1}
                </CardTitle>
                <CardDescription>
                  <Button variant="destructive" size="sm" onClick={() => removeImage(index)}>
                    {t("remove")}
                  </Button>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-32">
                  <Image
                    src={URL.createObjectURL(image) || "/placeholder.svg"}
                    alt={`${t("uploadedImage")} ${index + 1}`}
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
                {isProcessing ? (
                  <Skeleton className="w-full h-4 mt-2" />
                ) : results[index] ? (
                  <Badge className="mt-2">{results[index]}</Badge>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button onClick={processWithOpenAI} disabled={uploadedImages.length === 0 || isProcessing}>
          {isProcessing ? t("processing") : t("process")}
        </Button>
      </div>
    </div>
  )
}

export default TextReviewPage
