import { CAT_AVATARS, STAGE_OPTIONS } from "../../lib/journal"
import {
  Badge,
  BodyText,
  Field,
  PrimaryButton,
  SectionEyebrow,
  SectionTitle,
  Surface,
  TextArea,
  TextInput,
} from "../ui/primitives"
import { uiTokens } from "../ui/tokens"

export function MyPage({ profile, onProfileChange, onSaveProfile, profileSaving, onLogout }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Surface tint style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <SectionEyebrow>// me</SectionEyebrow>
          <SectionTitle>个人资料与账户</SectionTitle>
          <BodyText>
            品牌感更强的内容留在这里：头像、研究阶段、工作偏好，以及需要持久保存的个人上下文。
          </BodyText>
        </div>
      </Surface>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        <Surface style={{ padding: 22 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="名字">
              <TextInput
                value={profile.name}
                onChange={(event) => onProfileChange("name", event.target.value)}
                placeholder="你想在记录里怎样称呼自己"
              />
            </Field>
            <Field label="研究阶段">
              <select
                value={profile.stage}
                onChange={(event) => onProfileChange("stage", event.target.value)}
                style={{
                  width: "100%",
                  minHeight: 46,
                  borderRadius: uiTokens.radius.md,
                  border: `1px solid ${uiTokens.color.surfaceBorder}`,
                  padding: "12px 14px",
                  background: uiTokens.color.surface,
                }}
              >
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="研究方向">
              <TextInput
                value={profile.field}
                onChange={(event) => onProfileChange("field", event.target.value)}
                placeholder="例如：遗传学 / 生物信息学"
              />
            </Field>
            <Field label="机构">
              <TextInput
                value={profile.institution}
                onChange={(event) => onProfileChange("institution", event.target.value)}
                placeholder="学校、实验室或机构"
              />
            </Field>
            <Field label="工作方式">
              <TextArea
                value={profile.workStyle}
                onChange={(event) => onProfileChange("workStyle", event.target.value)}
                placeholder="例如：上午更适合写作，下午适合会议和沟通"
                style={{ minHeight: 100 }}
              />
            </Field>
            <Field label="近期压力来源">
              <TextArea
                value={profile.stressors}
                onChange={(event) => onProfileChange("stressors", event.target.value)}
                placeholder="例如：投稿、答辩、图表返修"
                style={{ minHeight: 100 }}
              />
            </Field>
            <Field label="长期目标">
              <TextArea
                value={profile.goals}
                onChange={(event) => onProfileChange("goals", event.target.value)}
                placeholder="例如：稳定记录、降低波动、把长期课题拆成更小节奏"
                style={{ minHeight: 100 }}
              />
            </Field>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <PrimaryButton onClick={onSaveProfile} disabled={profileSaving}>
                {profileSaving ? "保存中..." : "保存资料"}
              </PrimaryButton>
              <button
                onClick={onLogout}
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
                退出登录
              </button>
            </div>
          </div>
        </Surface>

        <Surface style={{ padding: 22, alignSelf: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <SectionEyebrow>// avatar</SectionEyebrow>
            <SectionTitle style={{ fontSize: 24 }}>选择你的头像</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
              {CAT_AVATARS.map((avatar) => {
                const active = profile.avatar === avatar
                return (
                  <button
                    key={avatar}
                    onClick={() => onProfileChange("avatar", avatar)}
                    style={{
                      minHeight: 72,
                      borderRadius: 18,
                      border: `1px solid ${active ? uiTokens.color.accentBorder : uiTokens.color.surfaceBorder}`,
                      background: active ? uiTokens.color.accentSoft : uiTokens.color.surface,
                      cursor: "pointer",
                      fontSize: 28,
                    }}
                  >
                    {avatar}
                  </button>
                )
              })}
            </div>
            <Badge>{profile.setupDone ? "资料已保存" : "还没有完整保存资料"}</Badge>
          </div>
        </Surface>
      </div>
    </div>
  )
}
