export const DEFAULT_PALETTE = ['#ABE57E', '#8BC7FF', '#FF99CE', '#FBBF24', '#A78BFA']

export const DEFAULT_PROJECT_COLOR = DEFAULT_PALETTE[0]
export const TODOS_COLOR = '#8BC7FF'
export const DEFAULT_THEME_COLOR = '#4a8a2a'

export function normalizeSettings(raw) {
  const themeColor = raw && typeof raw.themeColor === 'string' ? raw.themeColor : DEFAULT_THEME_COLOR
  const palette =
    raw && Array.isArray(raw.palette) && raw.palette.length === DEFAULT_PALETTE.length
      ? raw.palette
      : DEFAULT_PALETTE
  const pos = raw && raw.fabPosition
  const isRatio = (v) => typeof v === 'number' && v >= 0 && v <= 1
  const fabPosition = pos && isRatio(pos.fx) && isRatio(pos.fy) ? { fx: pos.fx, fy: pos.fy } : null
  const darkMode = !!(raw && raw.darkMode)
  const customCss = raw && typeof raw.customCss === 'string' ? raw.customCss : ''
  const customCssName = raw && typeof raw.customCssName === 'string' ? raw.customCssName : ''
  const customCssEnabled = raw && typeof raw.customCssEnabled === 'boolean' ? raw.customCssEnabled : true
  return { themeColor, palette, fabPosition, darkMode, customCss, customCssName, customCssEnabled }
}

export function progressGradient(hex) {
  return `linear-gradient(to right, color-mix(in srgb, ${hex} 88%, black), ${hex}, color-mix(in srgb, ${hex} 78%, white))`
}

export function readableTextColor(hex) {
  const clean = (hex || '').replace('#', '')
  if (clean.length < 6) return '#111827'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance >= 150 ? '#111827' : '#ffffff'
}
