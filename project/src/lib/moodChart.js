import { normalizeCatMood } from "./catAvatar.js"

const MOOD_COLORS = {
  happy: "#2c8c72",
  calm: "#4d9f88",
  focused: "#5f8fce",
  tired: "#8fa39a",
  stressed: "#d28c72",
  grumpy: "#cb6d62",
  excited: "#f09aa9",
}

export function buildMoodChartData(records) {
  const recent = Array.isArray(records) ? records.slice(0, 14).reverse() : []

  return recent.map((record) => {
    const key = normalizeCatMood(record?.mood)
    const moodValue = Number.isFinite(Number(record?.mood?.val)) ? Number(record.mood.val) : 3

    return {
      label: new Date(record.ts).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
      key,
      color: MOOD_COLORS[key] || MOOD_COLORS.calm,
      heightPercent: 40 + moodValue * 12,
    }
  })
}
