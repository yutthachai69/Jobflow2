/**
 * Client-only: resize + JPEG encode so camera/gallery photos stay under upload limits
 * while keeping reasonable detail for field documentation.
 */
export async function compressImageForUpload(
  file: File,
  maxBytes: number
): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= maxBytes) {
    return file
  }

  if (typeof document === 'undefined') {
    return file
  }

  if (file.type === 'image/gif') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    try {
      let w = bitmap.width
      let h = bitmap.height
      const maxEdge = 2048

      if (w > maxEdge || h > maxEdge) {
        if (w > h) {
          h = Math.round((h * maxEdge) / w)
          w = maxEdge
        } else {
          w = Math.round((w * maxEdge) / h)
          h = maxEdge
        }
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return file
      }

      const draw = () => {
        canvas.width = w
        canvas.height = h
        ctx.drawImage(bitmap, 0, 0, w, h)
      }

      draw()

      const toJpeg = (q: number) =>
        new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', q)
        })

      let quality = 0.88
      let blob: Blob | null = await toJpeg(quality)

      for (let pass = 0; pass < 24 && blob && blob.size > maxBytes; pass++) {
        if (quality > 0.52) {
          quality = Math.max(0.48, quality - 0.06)
          blob = await toJpeg(quality)
        } else {
          w = Math.floor(w * 0.86)
          h = Math.floor(h * 0.86)
          if (w < 480 || h < 480) {
            break
          }
          quality = 0.82
          draw()
          blob = await toJpeg(quality)
        }
      }

      if (!blob || blob.size === 0) {
        return file
      }

      const base = file.name.replace(/\.[^.]+$/, '') || 'photo'
      const outName = `${base}.jpg`
      return new File([blob], outName, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
    } finally {
      bitmap.close()
    }
  } catch {
    return file
  }
}
