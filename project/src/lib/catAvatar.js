export const CAT_EXPRESSIONS = {
  calm: {
    ears: 0,
    tail: 8,
    cheeks: 0.55,
    face: { eyes: "soft", mouth: "soft-smile" },
    decorations: [{ icon: "sparkles", x: 91, y: 24, rotate: 12, color: "#f2b75e", scale: 0.85, opacity: 0.65 }],
  },
  happy: {
    ears: -14,
    tail: 24,
    cheeks: 1,
    face: { eyes: "smile", mouth: "smile" },
    decorations: [{ icon: "heart", x: 92, y: 24, rotate: -10, color: "#ef6f86", scale: 0.92, opacity: 0.95 }],
  },
  focused: {
    ears: -4,
    tail: 12,
    cheeks: 0.45,
    face: { eyes: "focus", mouth: "neutral" },
    decorations: [{ icon: "star", x: 92, y: 22, rotate: 14, color: "#5f8fce", scale: 0.86, opacity: 0.85 }],
  },
  tired: {
    ears: -8,
    tail: -5,
    cheeks: 0.35,
    face: { eyes: "sleepy", mouth: "neutral" },
    decorations: [{ icon: "moon-star", x: 91, y: 22, rotate: 12, color: "#7b8ea4", scale: 0.9, opacity: 0.85 }],
  },
  stressed: {
    ears: -11,
    tail: 2,
    cheeks: 0.45,
    face: { eyes: "wide", mouth: "wobble" },
    decorations: [{ icon: "droplets", x: 91, y: 30, rotate: 10, color: "#61a7e8", scale: 0.95, opacity: 0.9 }],
  },
  grumpy: {
    ears: -18,
    tail: -10,
    cheeks: 0.5,
    face: { eyes: "angry", mouth: "frown" },
    decorations: [{ icon: "flame", x: 92, y: 26, rotate: 6, color: "#ef8b4e", scale: 0.9, opacity: 0.92 }],
  },
  excited: {
    ears: -20,
    tail: 38,
    cheeks: 1.15,
    face: { eyes: "spark", mouth: "open-smile" },
    decorations: [
      { icon: "sparkles", x: 90, y: 18, rotate: -10, color: "#f4c96e", scale: 0.98, opacity: 0.96 },
      { icon: "star", x: 99, y: 33, rotate: 12, color: "#f09aa9", scale: 0.7, opacity: 0.82 },
    ],
  },
  thinking: {
    ears: -3,
    tail: 10,
    cheeks: 0.45,
    face: { eyes: "thinking", mouth: "o" },
    decorations: [
      {
        icon: "message-circle-question",
        x: 93,
        y: 20,
        rotate: -8,
        color: "#5d7d8a",
        scale: 1,
        opacity: 0.9,
      },
    ],
  },
  saved: {
    ears: -10,
    tail: 26,
    cheeks: 0.95,
    face: { eyes: "smile", mouth: "smile" },
    decorations: [
      { icon: "circle-check", x: 89, y: 20, rotate: -5, color: "#2c8c72", scale: 0.94, opacity: 0.98 },
      { icon: "sparkles", x: 99, y: 34, rotate: 16, color: "#f2bf66", scale: 0.68, opacity: 0.8 },
    ],
  },
  welcome: {
    ears: -9,
    tail: 18,
    cheeks: 0.85,
    face: { eyes: "bright", mouth: "smile" },
    decorations: [
      { icon: "heart", x: 88, y: 23, rotate: -8, color: "#ef6f86", scale: 0.84, opacity: 0.88 },
      { icon: "sparkles", x: 100, y: 19, rotate: 10, color: "#f2bf66", scale: 0.76, opacity: 0.82 },
    ],
  },
}

const MOOD_ALIASES = {
  happy: "happy",
  calm: "calm",
  tired: "tired",
  excited: "excited",
  focused: "focused",
  stressed: "stressed",
  grumpy: "grumpy",
  welcome: "welcome",
  saved: "saved",
  thinking: "thinking",
  "开心": "happy",
  "平静": "calm",
  "专注": "focused",
  "疲惫": "tired",
  "焦虑": "stressed",
  "烦躁": "grumpy",
  "兴奋": "excited",
}

export function normalizeCatMood(mood) {
  if (mood && typeof mood === "object") {
    return normalizeCatMood(mood.value || mood.key || mood.label || mood.name || "")
  }

  const raw = String(mood || "").trim()
  if (!raw) return "calm"

  const exact = MOOD_ALIASES[raw]
  if (exact) return exact

  const english = raw.toLowerCase()
  return MOOD_ALIASES[english] || "calm"
}

export function resolveCatExpression({ mood = "calm", expression = null } = {}) {
  const key = CAT_EXPRESSIONS[expression] ? expression : normalizeCatMood(mood)
  return {
    key,
    ...CAT_EXPRESSIONS[key],
  }
}
