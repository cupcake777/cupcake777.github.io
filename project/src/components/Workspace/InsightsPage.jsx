import { BodyText, Metric, PrimaryButton, SectionEyebrow, SectionTitle, Surface, TextArea } from "../ui/primitives"
import { uiTokens } from "../ui/tokens"

export function InsightsPage({
  summary,
  records,
  digestMode,
  onDigestModeChange,
  digestText,
  digestLoading,
  onGenerateDigest,
  digestStatus,
}) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Surface tint style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <SectionEyebrow>// insights</SectionEyebrow>
          <SectionTitle>把最近的节奏连起来看</SectionTitle>
          <BodyText>
            洞察页吸收原先的报告功能。这里统一放记录频率、情绪趋势和 AI 摘要，而不是把它们拆到多个页面。
          </BodyText>
        </div>
      </Surface>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Metric label="总记录数" value={summary.total} />
        <Metric label="连续记录" value={`${summary.streak} 天`} />
        <Metric label="近 7 天均值" value={summary.averageMood} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <Surface style={{ padding: 22 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <SectionEyebrow>// trend</SectionEyebrow>
            <SectionTitle style={{ fontSize: 24 }}>最近状态分布</SectionTitle>
            {records.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                {records.slice(0, 8).map((record) => (
                  <div
                    key={record.id || record.ts}
                    style={{
                      display: "grid",
                      gap: 8,
                      paddingBottom: 12,
                      borderBottom: `1px solid ${uiTokens.color.surfaceBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ color: uiTokens.color.textStrong }}>
                        {record.activity || "未命名记录"}
                      </strong>
                      <span style={{ color: record.mood?.color || uiTokens.color.accentStrong }}>
                        {record.mood?.emoji || "•"}
                      </span>
                    </div>
                    <BodyText>{record.nextPlan || "未填写下一步。"}</BodyText>
                  </div>
                ))}
              </div>
            ) : (
              <BodyText>记录量还不足，先去“今日”留下几条内容。</BodyText>
            )}
          </div>
        </Surface>

        <Surface style={{ padding: 22 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <SectionEyebrow>// digest</SectionEyebrow>
            <SectionTitle style={{ fontSize: 24 }}>AI 周/月摘要</SectionTitle>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                ["week", "周报"],
                ["month", "月报"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => onDigestModeChange(mode)}
                  style={{
                    minHeight: 40,
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: `1px solid ${
                      digestMode === mode ? uiTokens.color.accentBorder : uiTokens.color.surfaceBorder
                    }`,
                    background: digestMode === mode ? uiTokens.color.accentSoft : uiTokens.color.surface,
                    color: digestMode === mode ? uiTokens.color.textStrong : uiTokens.color.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <BodyText>{digestStatus}</BodyText>
            <PrimaryButton onClick={onGenerateDigest} disabled={digestLoading || !records.length}>
              {digestLoading ? "生成中..." : "生成摘要"}
            </PrimaryButton>
            <TextArea
              value={digestText}
              readOnly
              style={{ minHeight: 180, whiteSpace: "pre-wrap", resize: "none" }}
            />
          </div>
        </Surface>
      </div>
    </div>
  )
}
