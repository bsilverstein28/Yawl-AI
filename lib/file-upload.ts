import type React from "react"
import * as XLSX from "xlsx"

export interface KeywordUpload {
  keyword: string
  target_url: string
  active?: boolean
}

export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (keywords: KeywordUpload[]) => void,
  onError: (error: string) => void,
) => {
  const file = event.target.files?.[0]
  if (!file) return

  const fileExtension = file.name.split(".").pop()?.toLowerCase()

  try {
    if (fileExtension === "csv") {
      await handleCSVUpload(file, onSuccess, onError)
    } else if (["xlsx", "xls"].includes(fileExtension || "")) {
      await handleExcelUpload(file, onSuccess, onError)
    } else {
      onError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)")
    }
  } catch (error) {
    console.error("File upload error:", error)
    onError("Failed to process file. Please check the format and try again.")
  }
}

const handleCSVUpload = async (
  file: File,
  onSuccess: (keywords: KeywordUpload[]) => void,
  onError: (error: string) => void,
) => {
  const text = await file.text()
  const lines = text.split("\n").filter((line) => line.trim())

  if (lines.length < 2) {
    onError("CSV file must have at least a header row and one data row")
    return
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const keywordIndex = headers.findIndex((h) => h.includes("keyword"))
  const urlIndex = headers.findIndex((h) => h.includes("url") || h.includes("link"))

  if (keywordIndex === -1 || urlIndex === -1) {
    onError("CSV must have columns for 'keyword' and 'url' (or 'link')")
    return
  }

  const keywords: KeywordUpload[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))

    if (values.length > keywordIndex && values.length > urlIndex) {
      const keyword = values[keywordIndex]
      const url = values[urlIndex]

      if (keyword && url) {
        keywords.push({
          keyword: keyword,
          target_url: url,
          active: true,
        })
      }
    }
  }

  if (keywords.length === 0) {
    onError("No valid keyword-URL pairs found in the file")
    return
  }

  onSuccess(keywords)
}

const handleExcelUpload = async (
  file: File,
  onSuccess: (keywords: KeywordUpload[]) => void,
  onError: (error: string) => void,
) => {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

  if (data.length < 2) {
    onError("Excel file must have at least a header row and one data row")
    return
  }

  const headers = data[0].map((h) => h?.toString().toLowerCase() || "")
  const keywordIndex = headers.findIndex((h) => h.includes("keyword"))
  const urlIndex = headers.findIndex((h) => h.includes("url") || h.includes("link"))

  if (keywordIndex === -1 || urlIndex === -1) {
    onError("Excel file must have columns for 'keyword' and 'url' (or 'link')")
    return
  }

  const keywords: KeywordUpload[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (row && row.length > keywordIndex && row.length > urlIndex) {
      const keyword = row[keywordIndex]?.toString().trim()
      const url = row[urlIndex]?.toString().trim()

      if (keyword && url) {
        keywords.push({
          keyword: keyword,
          target_url: url,
          active: true,
        })
      }
    }
  }

  if (keywords.length === 0) {
    onError("No valid keyword-URL pairs found in the file")
    return
  }

  onSuccess(keywords)
}

export const generateTemplate = () => {
  const template = [
    ["keyword", "url"],
    ["Nike", "https://nike.com/special-offer"],
    ["Apple", "https://apple.com/deals"],
    ["Tesla", "https://tesla.com/referral"],
    ["Amazon", "https://amazon.com/prime"],
    ["Google", "https://google.com/workspace"],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(template)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Keywords")

  // Generate and download the file
  XLSX.writeFile(workbook, "keyword-template.xlsx")
}
