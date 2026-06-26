const MB = 1024 * 1024

/** Upper cap so env mistakes cannot exceed a sane server / proxy budget */
const ABSOLUTE_MAX_BYTES = 10 * MB

/**
 * Max accepted upload size (single file body).
 * On Vercel, `next.config` sets NEXT_PUBLIC_MAX_UPLOAD_MB=4 at build (below ~4.5MB function body limit).
 */
export function getMaxUploadBytes(): number {
  const raw = process.env.NEXT_PUBLIC_MAX_UPLOAD_MB
  if (raw != null && raw !== '') {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) {
      return Math.min(Math.floor(n * MB), ABSOLUTE_MAX_BYTES)
    }
  }
  return 10 * MB
}

/** Target size for client-side compression (leave headroom for multipart overhead). */
export function getCompressTargetBytes(): number {
  return Math.floor(getMaxUploadBytes() * 0.9)
}

export function getMaxUploadLabelMb(): string {
  const n = getMaxUploadBytes() / MB
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '')
}
