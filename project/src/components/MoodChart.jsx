import { useMemo } from "react"
import { uiTokens } from "./ui/tokens"

const MOOD_COLORS = {
  happy: "#FFD93D",
  calm: "#6BCB77",
  tired: "#A8DADC",
  excited: "#FF6B9D",
}

export function MoodChart({ records, height = 180 }) {
  const chartData = useMemo(() => {
    const recent = records.slice(0, 14).reverse()
    return recent.map((r) => ({
      label: new Date(r.ts).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
      mood: r.mood?.value || "calm",
      color: MOOD_COLORS[r.mood?.value] || MOOD_COLORS.calm,
    }))
  }, [records])

  if (!chartData.length) return null

  const barWidth = 100 / chartData.length

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
      <div style={{ width: "100%", height }}>
        <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: 4 }}>
          {chartData.map((item, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: "100%",
                  height: `${60 + Math.random() * 40}%`,
                  background: item.color,
                  borderRadius: "8px 8px 0 0",
                  transition: "all 0.3s ease",
                  animation: `slideUp 0.5s ease ${i * 0.05}s backwards`,
                }}
              />
              <span style={{ fontSize: 11, color: uiTokens.color.textMuted }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
