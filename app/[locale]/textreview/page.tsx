"use client"

export const dynamic = "force-static"
export const revalidate = false

import { useTranslations } from "next-intl"

export default function TextReviewPage() {
  const t = useTranslations("TextReviewPage")

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      {/* Add more content here as needed */}
    </div>
  )
}
