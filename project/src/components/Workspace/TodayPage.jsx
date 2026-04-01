import { MOODS, summarizeRecords } from "../../lib/journal"
import {
  Badge,
  BodyText,
  Field,
  Metric,
  PrimaryButton,
  SectionEyebrow,
  SectionTitle,
  Surface,
  TextArea,
  TextInput,
} from "../ui/primitives"
import { uiTokens } from "../ui/tokens"
import { CatAvatar } from "../CatAvatar"
import { MoodChart } from "../MoodChart"

export function TodayPage({
  profile,
  records,
  draft,
  onDraftChange,
  onResetDraft,
  onSaveDraft,
  savePending,
  onOpenTimeline,
  onOpenInsights,
}) {
  const summary = summarizeRecords(records)
  const displayName = profile?.name || "今天"

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Surface tint style={{ padding: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <CatAvatar mood={draft.mood || summary.todayRecords[0]?.mood || "calm"} size={100} />
            <div style={{ display: "grid", gap: 8, maxWidth: 640 }}>
              <SectionEyebrow>// today</SectionEyebrow>
              <SectionTitle>你好，{displayName}。</SectionTitle>
              <BodyText>
                先用一条记录标记你现在的状态。工作台默认只把今天和本周放在最前面。
              </BodyText>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge>{summary.hasToday ? "今天已记录" : "今天还没有记录"}</Badge>
            <Badge tone="muted">近 7 天均值 {summary.averageMood}</Badge>
          </div>
        </div>
      </Surface>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        <Metric label="连续记录" value={`${summary.streak} 天`} />
        <Metric label="近 7 天有记录" value={`${summary.weeklyCount} 天`} />
        <Metric label="累计完成事项" value={summary.completedGoals} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <Surface style={{ padding: 22 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <SectionEyebrow>// quick log</SectionEyebrow>
              <SectionTitle style={{ fontSize: 24 }}>一分钟完成今天这条记录</SectionTitle>
              <BodyText>核心只保留三件事：现在在做什么、当前状态、下一步打算推进什么。</BodyText>
            </div>

            <Field label="现在在做什么">
              <TextArea
                value={draft.activity}
                onChange={(event) => onDraftChange("activity", event.target.value)}
                placeholder="例如：整理结果、写图注、开组会前收尾..."
                style={{ minHeight: 112 }}
              />
            </Field>

            <Field label="现在的状态">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 10 }}>
                {MOODS.map((mood) => {
                  const active = draft.mood?.label === mood.label
                  return (
                    <button
                      key={mood.label}
                      onClick={() => onDraftChange("mood", mood)}
                      style={{
                        padding: "12px 10px",
                        borderRadius: uiTokens.radius.md,
                        border: `1px solid ${active ? mood.color : uiTokens.color.surfaceBorder}`,
                        background: active ? `${mood.color}18` : uiTokens.color.surface,
                        cursor: "pointer",
                        display: "grid",
                        gap: 6,
                        placeItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{mood.emoji}</span>
                      <span style={{ color: uiTokens.color.textStrong, fontSize: 13 }}>{mood.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="接下来要推进什么">
              <TextInput
                value={draft.nextPlan}
                onChange={(event) => onDraftChange("nextPlan", event.target.value)}
                placeholder="例如：先写 20 分钟，再检查统计表"
              />
            </Field>

            <div style={{ display: "grid", gap: 12 }}>
              <BodyText style={{ color: uiTokens.color.textStrong, fontWeight: 600 }}>今天最重要的三件小事</BodyText>
              {draft.goals.map((goal, index) => (
                <TextInput
                  key={index}
                  value={goal}
                  onChange={(event) => {
                    const nextGoals = [...draft.goals]
                    nextGoals[index] = event.target.value
                    onDraftChange("goals", nextGoals)
                  }}
                  placeholder={["第一件", "第二件（可选）", "第三件（可选）"][index]}
                />
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PrimaryButton onClick={onSaveDraft} disabled={savePending}>
                {savePending ? "保存中..." : "保存今天这条记录"}
              </PrimaryButton>
              <button
                onClick={onResetDraft}
                style={{
                  minHeight: 46,
                  padding: "12px 18px",
                  borderRadius: uiTokens.radius.md,
                  border: `1px solid ${uiTokens.color.surfaceBorder}`,
                  background: "transparent",
                  color: uiTokens.color.textMuted,
                  cursor: "pointer",
                }}
              >
                清空草稿
              </button>
            </div>
          </div>
        </Surface>

        <div style={{ display: "grid", gap: 20 }}>
          <Surface style={{ padding: 22 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <SectionEyebrow>// today timeline</SectionEyebrow>
              <SectionTitle style={{ fontSize: 22 }}>今天留下了什么</SectionTitle>
              {summary.todayRecords.length ? (
                summary.todayRecords.map((record) => (
                  <div
                    key={record.id || record.ts}
                    style={{
                      display: "grid",
                      gap: 6,
                      padding: 14,
                      borderRadius: 16,
                      border: `1px solid ${uiTokens.color.surfaceBorder}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ color: uiTokens.color.textStrong }}>{record.activity}</strong>
                      <Badge tone="muted">{record.mood?.label || "未标记"}</Badge>
                    </div>
                    <BodyText>{record.nextPlan || "还没有写下一步。"}</BodyText>
                  </div>
                ))
              ) : (
                <BodyText>今天还没有任何记录。先从上面的主卡开始。</BodyText>
              )}
              <button
                onClick={onOpenTimeline}
                style={{
                  justifySelf: "start",
                  background: "transparent",
                  border: "none",
                  color: uiTokens.color.accentStrong,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                去时间线查看更多
              </button>
            </div>
          </Surface>

          <Surface tint style={{ padding: 22 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <SectionEyebrow>// week</SectionEyebrow>
              <SectionTitle style={{ fontSize: 22 }}>本周回看</SectionTitle>
              <BodyText>当前已经有 {summary.weeklyCount} 天留下记录。</BodyText>
              <MoodChart records={records} height={140} />
              <button
                onClick={onOpenInsights}
                style={{
                  justifySelf: "start",
                  background: "transparent",
                  border: "none",
                  color: uiTokens.color.accentStrong,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                去洞察页看完整趋势
              </button>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
