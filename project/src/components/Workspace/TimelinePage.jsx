import { formatDateTime } from "../../lib/journal"
import { Badge, BodyText, SectionEyebrow, SectionTitle, Surface, TextInput } from "../ui/primitives"
import { uiTokens } from "../ui/tokens"

export function TimelinePage({ records, selectedRecord, onSelect, search, onSearchChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
      }}
    >
      <Surface style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <SectionEyebrow>// timeline</SectionEyebrow>
            <SectionTitle>按时间看你的记录</SectionTitle>
            <BodyText>这里不再叫“档案”，而是可浏览、可检索、可点开的时间线。</BodyText>
          </div>
          <TextInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="搜索活动、计划或心情..."
          />
          <div style={{ display: "grid", gap: 10 }}>
            {records.length ? (
              records.map((record) => {
                const active = selectedRecord?.id === record.id
                return (
                  <button
                    key={record.id || record.ts}
                    onClick={() => onSelect(record)}
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 18,
                      border: `1px solid ${active ? uiTokens.color.accentBorder : uiTokens.color.surfaceBorder}`,
                      background: active ? uiTokens.color.accentSoft : uiTokens.color.surface,
                      cursor: "pointer",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <strong style={{ color: uiTokens.color.textStrong }}>
                        {record.activity || "未命名记录"}
                      </strong>
                      <Badge tone="muted">{record.mood?.label || "未标记"}</Badge>
                    </div>
                    <BodyText>{record.nextPlan || "没有填写下一步。"}</BodyText>
                    <span style={{ color: uiTokens.color.textMuted, fontSize: 13 }}>
                      {formatDateTime(record.ts)}
                    </span>
                  </button>
                )
              })
            ) : (
              <BodyText>当前筛选条件下没有记录。</BodyText>
            )}
          </div>
        </div>
      </Surface>

      <Surface tint style={{ padding: 22, alignSelf: "start" }}>
        {selectedRecord ? (
          <div style={{ display: "grid", gap: 14 }}>
            <SectionEyebrow>// detail</SectionEyebrow>
            <SectionTitle style={{ fontSize: 22 }}>
              {selectedRecord.activity || "这条记录没有标题"}
            </SectionTitle>
            <BodyText>{formatDateTime(selectedRecord.ts)}</BodyText>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge>{selectedRecord.mood?.label || "未标记心情"}</Badge>
              {selectedRecord.mental ? <Badge tone="muted">{selectedRecord.mental}</Badge> : null}
              {selectedRecord.physical ? <Badge tone="muted">{selectedRecord.physical}</Badge> : null}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ color: uiTokens.color.textStrong }}>下一步</strong>
              <BodyText>{selectedRecord.nextPlan || "没有写下一步。"}</BodyText>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <strong style={{ color: uiTokens.color.textStrong }}>今日事项</strong>
              {(selectedRecord.goals || []).filter(Boolean).length ? (
                <div style={{ display: "grid", gap: 6 }}>
                  {selectedRecord.goals
                    .filter(Boolean)
                    .map((goal, index) => (
                      <BodyText key={`${goal}-${index}`}>{index + 1}. {goal}</BodyText>
                    ))}
                </div>
              ) : (
                <BodyText>这条记录没有附加事项。</BodyText>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <SectionEyebrow>// detail</SectionEyebrow>
            <SectionTitle style={{ fontSize: 22 }}>先点开左边的一条记录</SectionTitle>
            <BodyText>详细信息会显示在这里，便于在桌面端快速对照时间线与内容。</BodyText>
          </div>
        )}
      </Surface>
    </div>
  )
}
