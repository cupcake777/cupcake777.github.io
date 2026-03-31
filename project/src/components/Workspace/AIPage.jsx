import { BodyText, PrimaryButton, SectionEyebrow, SectionTitle, Surface, TextArea } from "../ui/primitives"

export function AIPage({
  prompt,
  onPromptChange,
  onAsk,
  answer,
  loading,
  hasConfig,
}) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Surface tint style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <SectionEyebrow>// ai</SectionEyebrow>
          <SectionTitle>把 AI 放回辅助位</SectionTitle>
          <BodyText>
            这里保留基于近期记录的陪伴式提问与摘要能力，但它不再和“今天先记一条”争抢首页位置。
          </BodyText>
        </div>
      </Surface>

      <Surface style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 16 }}>
          <TextArea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="例如：帮我根据最近一周的状态给一个更稳妥的推进建议。"
            style={{ minHeight: 160 }}
          />
          <BodyText>{hasConfig ? "会把你的近期记录作为上下文一起发送。" : "还没有配置 AI Key，请先去工具菜单里的 AI 设置。"}</BodyText>
          <PrimaryButton onClick={onAsk} disabled={loading || !prompt.trim() || !hasConfig}>
            {loading ? "请求中..." : "向 AI 提问"}
          </PrimaryButton>
        </div>
      </Surface>

      <Surface style={{ padding: 22 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <SectionEyebrow>// response</SectionEyebrow>
          <SectionTitle style={{ fontSize: 24 }}>结果</SectionTitle>
          <BodyText style={{ whiteSpace: "pre-wrap" }}>
            {answer || "AI 回复会显示在这里。"}
          </BodyText>
        </div>
      </Surface>
    </div>
  )
}
