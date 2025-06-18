export const languages = ["en", "zh", "ja"] as const

export type Language = (typeof languages)[number]

export const defaultLanguage: Language = "zh"

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
}

export const fallbackLng = defaultLanguage
export const cookieName = "i18nlng"

export function getOptions(lng = fallbackLng, ns = "common") {
  return {
    debug: false,
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: ns,
    defaultNS: ns,
    ns,
  }
}
