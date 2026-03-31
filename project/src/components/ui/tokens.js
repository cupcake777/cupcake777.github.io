import { SITE_THEME } from "../../config/site"

export const uiTokens = {
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
  },
  font: {
    heading: '"Schibsted Grotesk", "Noto Sans SC", "PingFang SC", sans-serif',
    body: '"Source Sans 3", "Noto Sans SC", "PingFang SC", sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace',
  },
  shadow: {
    card: SITE_THEME.shadow,
  },
  color: SITE_THEME,
}

export function rgba(hex, alpha) {
  const value = hex.replace("#", "")
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((item) => `${item}${item}`)
          .join("")
      : value
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
