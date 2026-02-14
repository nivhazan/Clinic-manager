import Tesseract from 'tesseract.js'
import type { ExtractedFields } from '@/types'

export interface OcrResult {
  text: string
  extractedFields: ExtractedFields
}

/**
 * Run OCR on an image and extract relevant fields
 */
export async function runOcr(imageData: string): Promise<OcrResult> {
  // Run Tesseract OCR with Hebrew + English
  const result = await Tesseract.recognize(imageData, 'heb+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        // Could emit progress here if needed
      }
    },
  })

  const text = result.data.text
  const extractedFields = extractFieldsFromText(text)

  return {
    text,
    extractedFields,
  }
}

/**
 * Extract structured fields from OCR text
 */
function extractFieldsFromText(text: string): ExtractedFields {
  const fields: ExtractedFields = {
    confidence: {},
  }

  // Normalize text for parsing
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Extract amount (look for currency patterns)
  const amountResult = extractAmount(normalizedText)
  if (amountResult) {
    fields.amount = amountResult.value
    fields.confidence!.amount = amountResult.confidence
  }

  // Extract date
  const dateResult = extractDate(normalizedText)
  if (dateResult) {
    fields.date = dateResult.value
    fields.confidence!.date = dateResult.confidence
  }

  // Extract vendor (usually first meaningful line or after specific keywords)
  const vendorResult = extractVendor(lines)
  if (vendorResult) {
    fields.vendor = vendorResult.value
    fields.confidence!.vendor = vendorResult.confidence
  }

  // Extract document number (invoice/receipt number)
  const docNumberResult = extractDocNumber(normalizedText)
  if (docNumberResult) {
    fields.docNumber = docNumberResult.value
    fields.confidence!.docNumber = docNumberResult.confidence
  }

  return fields
}

interface ExtractionResult<T> {
  value: T
  confidence: number
}

function extractAmount(text: string): ExtractionResult<number> | null {
  // Patterns for Israeli currency
  const patterns = [
    // ₪123.45 or ₪ 123.45
    /₪\s*([\d,]+(?:\.\d{2})?)/g,
    // 123.45 ש"ח or 123.45 שח or 123.45 שקל
    /([\d,]+(?:\.\d{2})?)\s*(?:ש"ח|שח|שקל|ש״ח)/g,
    // סה"כ 123.45 or סהכ 123.45
    /(?:סה"כ|סהכ|סה״כ|סכום|לתשלום|total)\s*:?\s*([\d,]+(?:\.\d{2})?)/gi,
    // Just numbers with decimals (lower confidence)
    /\b([\d,]+\.\d{2})\b/g,
  ]

  let bestMatch: { value: number; confidence: number } | null = null

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const matches = [...text.matchAll(pattern)]

    for (const match of matches) {
      const numStr = match[1].replace(/,/g, '')
      const value = parseFloat(numStr)

      if (!isNaN(value) && value > 0) {
        // Higher confidence for earlier patterns
        const confidence = 0.9 - (i * 0.15)

        if (!bestMatch || value > bestMatch.value) {
          bestMatch = { value, confidence: Math.max(0.3, confidence) }
        }
      }
    }
  }

  return bestMatch
}

function extractDate(text: string): ExtractionResult<string> | null {
  // Date patterns
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g,
    // DD/MM/YY or DD-MM-YY
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})/g,
    // Hebrew date format: 1 בינואר 2024
    /(\d{1,2})\s+(?:ב)?(ינואר|פברואר|מרץ|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)\s+(\d{4})/g,
  ]

  const hebrewMonths: Record<string, number> = {
    'ינואר': 1, 'פברואר': 2, 'מרץ': 3, 'אפריל': 4, 'מאי': 5, 'יוני': 6,
    'יולי': 7, 'אוגוסט': 8, 'ספטמבר': 9, 'אוקטובר': 10, 'נובמבר': 11, 'דצמבר': 12,
  }

  // Try DD/MM/YYYY pattern first
  const datePattern1 = patterns[0]
  const matches1 = [...text.matchAll(datePattern1)]
  for (const match of matches1) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return { value: dateStr, confidence: 0.85 }
    }
  }

  // Try DD/MM/YY pattern
  const datePattern2 = patterns[1]
  const matches2 = [...text.matchAll(datePattern2)]
  for (const match of matches2) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    let year = parseInt(match[3], 10)

    // Assume 20XX for two-digit years
    if (year < 100) year += 2000

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return { value: dateStr, confidence: 0.75 }
    }
  }

  // Try Hebrew date pattern
  const datePattern3 = patterns[2]
  const matches3 = [...text.matchAll(datePattern3)]
  for (const match of matches3) {
    const day = parseInt(match[1], 10)
    const monthName = match[2]
    const year = parseInt(match[3], 10)
    const month = hebrewMonths[monthName]

    if (month && day >= 1 && day <= 31) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      return { value: dateStr, confidence: 0.8 }
    }
  }

  return null
}

function extractVendor(lines: string[]): ExtractionResult<string> | null {
  // Skip common header words
  const skipPatterns = [
    /^(תאריך|date|מספר|number|סכום|amount|total|סה"כ|חשבונית|קבלה|invoice|receipt)/i,
    /^\d+$/,
    /^[\d\.\-\/\s]+$/,
  ]

  // Look for vendor-related keywords
  const vendorKeywords = ['ספק', 'עסק', 'חברה', 'vendor', 'supplier', 'from']

  // First, try to find vendor after a keyword
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    for (const keyword of vendorKeywords) {
      if (line.includes(keyword)) {
        // Check if vendor name is on same line after colon
        const colonIndex = lines[i].indexOf(':')
        if (colonIndex !== -1) {
          const vendor = lines[i].substring(colonIndex + 1).trim()
          if (vendor.length > 2) {
            return { value: vendor, confidence: 0.8 }
          }
        }
        // Or on next line
        if (i + 1 < lines.length && lines[i + 1].length > 2) {
          return { value: lines[i + 1], confidence: 0.7 }
        }
      }
    }
  }

  // Fall back to first meaningful line (often the business name)
  for (const line of lines.slice(0, 5)) {
    const isSkip = skipPatterns.some(p => p.test(line))
    if (!isSkip && line.length > 3 && line.length < 50) {
      // Likely a business name
      return { value: line, confidence: 0.5 }
    }
  }

  return null
}

function extractDocNumber(text: string): ExtractionResult<string> | null {
  // Patterns for invoice/receipt numbers
  const patterns = [
    // מס' חשבונית: 12345 or מספר קבלה: 12345
    /(?:מס['׳]?\s*|מספר\s*)(?:חשבונית|קבלה|מסמך|הזמנה|invoice|receipt)\s*:?\s*([A-Za-z0-9\-]+)/gi,
    // Invoice #12345 or Receipt No. 12345
    /(?:invoice|receipt|doc)\s*(?:#|no\.?|number)\s*:?\s*([A-Za-z0-9\-]+)/gi,
    // Just look for # followed by numbers
    /#\s*(\d+)/g,
  ]

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = pattern.exec(text)

    if (match && match[1]) {
      const confidence = 0.85 - (i * 0.15)
      return { value: match[1], confidence: Math.max(0.4, confidence) }
    }
  }

  return null
}
