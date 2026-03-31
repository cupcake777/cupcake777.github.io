import { PUBLIC_NAV_ITEMS } from "../../config/site"
import {
  AppFrame,
  Badge,
  BodyText,
  Container,
  PageTitle,
  PrimaryButton,
  SectionEyebrow,
  SectionTitle,
  SecondaryButton,
  Surface,
} from "../ui/primitives"
import { uiTokens } from "../ui/tokens"

const FEATURE_ITEMS = [
  {
    title: "快速记录",
    description: "用最短路径记下现在在做什么、当前状态和接下来要推进的事。",
  },
  {
    title: "时间线回看",
    description: "把每天留下来的片段整理成清晰时间线，不需要翻很多卡片。",
  },
  {
    title: "周月洞察",
    description: "用轻量趋势和摘要把情绪、节奏和完成度连起来看。",
  },
]

export function PublicHome({ onStart, onLogin }) {
  return (
    <AppFrame>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(18px)",
          background: "rgba(255, 253, 250, 0.92)",
          borderBottom: `1px solid ${uiTokens.color.surfaceBorder}`,
        }}
      >
        <Container
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            minHeight: 72,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontFamily: uiTokens.font.mono, fontSize: 15 }}>cat journal</strong>
            <span style={{ color: uiTokens.color.textMuted, fontSize: 13 }}>
              private daily log for research life
            </span>
          </div>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {PUBLIC_NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={`#${item.key}`}
                style={{
                  color: uiTokens.color.textMuted,
                  fontSize: 14,
                }}
              >
                {item.label}
              </a>
            ))}
            <SecondaryButton onClick={onLogin} style={{ minHeight: 40, paddingInline: 14 }}>
              已有账户
            </SecondaryButton>
          </nav>
        </Container>
      </header>

      <main>
        <Container
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            alignItems: "center",
            paddingTop: 56,
            paddingBottom: 48,
          }}
        >
          <div style={{ display: "grid", gap: 22 }}>
            <SectionEyebrow>// cat journal</SectionEyebrow>
            <PageTitle>把每天的状态记清楚，留给未来的自己去看。</PageTitle>
            <BodyText style={{ fontSize: 19, maxWidth: 620 }}>
              这是一个给研究者、学生和长期脑力工作者准备的私人日志。它不强调打卡热闹感，只帮你更快地记录今天，并更从容地回看本周。
            </BodyText>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <PrimaryButton onClick={onStart}>开始使用</PrimaryButton>
              <SecondaryButton onClick={onLogin}>我已经注册过</SecondaryButton>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge>注册优先</Badge>
              <Badge>设备会话自动登录</Badge>
              <Badge tone="muted">薄荷绿工作台</Badge>
            </div>
          </div>

          <Surface tint style={{ padding: 24 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <Surface style={{ padding: 18 }}>
                <SectionEyebrow style={{ marginBottom: 12 }}>today</SectionEyebrow>
                <div style={{ display: "grid", gap: 10 }}>
                  <div
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${uiTokens.color.surfaceBorder}`,
                      padding: 16,
                    }}
                  >
                    <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>现在在做什么</div>
                    <BodyText>整理分析结果，准备补一段图注。</BodyText>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div
                      style={{
                        borderRadius: 16,
                        border: `1px solid ${uiTokens.color.surfaceBorder}`,
                        padding: 16,
                      }}
                    >
                      <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>心情</div>
                      <BodyText>平静，能推进。</BodyText>
                    </div>
                    <div
                      style={{
                        borderRadius: 16,
                        border: `1px solid ${uiTokens.color.surfaceBorder}`,
                        padding: 16,
                      }}
                    >
                      <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>下一步</div>
                      <BodyText>先写 20 分钟，再看是否休息。</BodyText>
                    </div>
                  </div>
                </div>
              </Surface>
              <BodyText>
                从公开首页进入时，你看到的是产品价值；登录之后，界面会直接切换成更克制的工作台。
              </BodyText>
            </div>
          </Surface>
        </Container>

        <Container id="value" style={{ display: "grid", gap: 20, paddingBottom: 40 }}>
          <SectionEyebrow>// why</SectionEyebrow>
          <SectionTitle>它不是宠物社区，也不是重型效率工具。</SectionTitle>
          <BodyText style={{ maxWidth: 760 }}>
            这是一种更轻的记录方式。你不需要每次都完整复盘，只要把今天的活动、状态和下一步留下来，时间线和洞察会帮你把节奏串起来。
          </BodyText>
        </Container>

        <Container
          id="how"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            paddingBottom: 48,
          }}
        >
          {FEATURE_ITEMS.map((item) => (
            <Surface key={item.title} style={{ padding: 20 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <SectionEyebrow>{item.title}</SectionEyebrow>
                <SectionTitle style={{ fontSize: 22 }}>{item.title}</SectionTitle>
                <BodyText>{item.description}</BodyText>
              </div>
            </Surface>
          ))}
        </Container>

        <Container id="insights" style={{ paddingBottom: 60 }}>
          <Surface tint style={{ padding: 24 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <SectionEyebrow>// insights</SectionEyebrow>
              <SectionTitle>先记一条，再回头看一周。</SectionTitle>
              <BodyText style={{ maxWidth: 760 }}>
                回顾页会把记录频率、情绪走势、完成度和 AI 摘要组织成一条连续视角，而不是分散在几个互不相干的页面里。
              </BodyText>
            </div>
          </Surface>
        </Container>

        <Container id="auth" style={{ paddingBottom: 80 }}>
          <Surface style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 620 }}>
                <SectionEyebrow>// start</SectionEyebrow>
                <SectionTitle>第一次使用先注册，之后设备会自动带你回到工作台。</SectionTitle>
              </div>
              <PrimaryButton onClick={onStart}>进入注册</PrimaryButton>
            </div>
          </Surface>
        </Container>
      </main>
    </AppFrame>
  )
}
