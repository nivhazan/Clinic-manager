/**
 * Upload Security — MIME magic byte validation & rate limiting
 */

// Known file signatures (magic bytes)
const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  // WebP: RIFF....WEBP
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" — we also check offset 8 below
  // PDF: %PDF
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
]

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50] // "WEBP" at offset 8

/**
 * Reads a file's first bytes and validates the MIME type against known magic byte signatures.
 * Returns true if the file's actual bytes match one of the allowed types (JPG/PNG/WebP/PDF).
 */
export async function validateFileBytes(file: File): Promise<boolean> {
  const slice = file.slice(0, 12)
  const buffer = await slice.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (bytes.length < 4) return false

  for (const sig of SIGNATURES) {
    if (matchBytes(bytes, sig.bytes, 0)) {
      // Special case: WebP needs RIFF + "WEBP" at offset 8
      if (sig.mime === 'image/webp') {
        if (bytes.length >= 12 && matchBytes(bytes, WEBP_MARKER, 8)) {
          return true
        }
        continue
      }
      return true
    }
  }

  return false
}

function matchBytes(data: Uint8Array, signature: number[], offset: number): boolean {
  if (data.length < offset + signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (data[offset + i] !== signature[i]) return false
  }
  return true
}

/**
 * Creates a sliding-window rate limiter for uploads.
 * Tracks timestamps of recent uploads and rejects when the limit is exceeded.
 */
export function createUploadRateLimiter(maxUploads: number, windowMs: number) {
  const timestamps: number[] = []

  return {
    canUpload(): boolean {
      const now = Date.now()
      // Remove expired timestamps
      while (timestamps.length > 0 && timestamps[0] <= now - windowMs) {
        timestamps.shift()
      }
      if (timestamps.length >= maxUploads) {
        return false
      }
      timestamps.push(now)
      return true
    },
  }
}
