import { useMemo } from "react"
import { buildMoodChartData } from "../lib/moodChart"
import { uiTokens } from "./ui/tokens"

export function MoodChart({ records, height = 180 }) {
  const chartData = useMemo(() => buildMoodChartData(records), [records])

  if (!chartData.length) return null

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
                  height: `${item.heightPercent}%`,
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
