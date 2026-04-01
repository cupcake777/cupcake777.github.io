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
import { EASE } from "../ui/motionTokens"
import { motion } from "framer-motion"

const MotionHeader = motion.header
const MotionAnchor = motion.a
const MotionDiv = motion.div

const FEATURE_ITEMS = [
  { title: "快速记录", description: "最短路径记下当前状态和下一步。" },
  { title: "时间线回看", description: "片段整理成清晰时间线。" },
  { title: "周月洞察", description: "趋势和摘要连接情绪、节奏与完成度。" },
]

const headerVariants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE.out } },
}

const heroContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const heroItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE.out } },
}

const cardVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { delay: 0.1 + i * 0.15, duration: 0.5, ease: EASE.out },
  }),
}

const demoCardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { delay: 0.3, duration: 0.5, ease: EASE.out } },
}

export function PublicHome({ onStart, onLogin }) {
  return (
    <AppFrame>
      <MotionHeader
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(20px)",
          background: "rgba(255, 253, 250, 0.85)",
          borderBottom: `1px solid ${uiTokens.color.surfaceBorder}`,
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.6)",
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
              <MotionAnchor
                key={item.key}
                href={`#${item.key}`}
                whileHover={{ color: uiTokens.color.accentStrong }}
                style={{ color: uiTokens.color.textMuted, fontSize: 14 }}
              >
                {item.label}
              </MotionAnchor>
            ))}
            <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <SecondaryButton onClick={onLogin} style={{ minHeight: 40, paddingInline: 14 }}>
                已有账户
              </SecondaryButton>
            </MotionDiv>
          </nav>
        </Container>
      </MotionHeader>

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
          <MotionDiv variants={heroContentVariants} initial="hidden" animate="visible">
            <MotionDiv variants={heroItemVariants}>
              <SectionEyebrow>// cat journal</SectionEyebrow>
            </MotionDiv>
            <MotionDiv variants={heroItemVariants}>
              <PageTitle>记录当下，回看轨迹。</PageTitle>
            </MotionDiv>
            <MotionDiv variants={heroItemVariants}>
              <BodyText style={{ fontSize: 19, maxWidth: 620 }}>
                为研究者和长期脑力工作者设计的私人日志。快速记录，清晰回看，轻量洞察。
              </BodyText>
            </MotionDiv>
            <MotionDiv
              variants={heroItemVariants}
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              <MotionDiv whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                <PrimaryButton onClick={onStart}>开始使用</PrimaryButton>
              </MotionDiv>
              <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <SecondaryButton onClick={onLogin}>我已经注册过</SecondaryButton>
              </MotionDiv>
            </MotionDiv>
            <MotionDiv
              variants={heroItemVariants}
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <Badge>Register first</Badge>
              <Badge>Auto session</Badge>
              <Badge tone="muted">Mint workspace</Badge>
            </MotionDiv>
          </MotionDiv>

          <MotionDiv variants={demoCardVariants} initial="hidden" animate="visible">
            <Surface
              tint
              style={{
                padding: 24,
                boxShadow:
                  "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
              }}
            >
              <div style={{ display: "grid", gap: 18 }}>
                <Surface style={{ padding: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                  <SectionEyebrow style={{ marginBottom: 12 }}>today</SectionEyebrow>
                  <div style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        borderRadius: 16,
                        border: `1px solid ${uiTokens.color.surfaceBorder}`,
                        padding: 16,
                      }}
                    >
                      <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>
                        现在在做什么
                      </div>
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
                        <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>
                          心情
                        </div>
                        <BodyText>平静，能推进。</BodyText>
                      </div>
                      <div
                        style={{
                          borderRadius: 16,
                          border: `1px solid ${uiTokens.color.surfaceBorder}`,
                          padding: 16,
                        }}
                      >
                        <div style={{ color: uiTokens.color.textStrong, fontWeight: 700 }}>
                          下一步
                        </div>
                        <BodyText>先写 20 分钟，再看是否休息。</BodyText>
                      </div>
                    </div>
                  </div>
                </Surface>
                <BodyText>
                  登录后切换至薄荷绿工作台。
                </BodyText>
              </div>
            </Surface>
          </MotionDiv>
        </Container>

        <Container id="value" style={{ display: "grid", gap: 20, paddingBottom: 40 }}>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionEyebrow>// why</SectionEyebrow>
            <SectionTitle>轻量记录，连续视角。</SectionTitle>
            <BodyText style={{ maxWidth: 760 }}>
              无需完整复盘，记下今天的活动、状态和下一步，时间线和洞察自动串联节奏。
            </BodyText>
          </MotionDiv>
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
          {FEATURE_ITEMS.map((item, i) => (
            <MotionDiv
              key={item.title}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
            >
              <Surface
                style={{ padding: 20, transition: "transform 0.2s, box-shadow 0.2s" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div style={{ display: "grid", gap: 10 }}>
                  <SectionEyebrow>{item.title}</SectionEyebrow>
                  <SectionTitle style={{ fontSize: 22 }}>{item.title}</SectionTitle>
                  <BodyText>{item.description}</BodyText>
                </div>
              </Surface>
            </MotionDiv>
          ))}
        </Container>

        <Container id="insights" style={{ paddingBottom: 60 }}>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Surface
              tint
              style={{
                padding: 24,
                boxShadow:
                  "0 20px 60px rgba(18, 35, 27, 0.10), 0 8px 24px rgba(44, 140, 114, 0.08)",
              }}
            >
              <div style={{ display: "grid", gap: 12 }}>
                <SectionEyebrow>// insights</SectionEyebrow>
                <SectionTitle>记录，然后回看。</SectionTitle>
                <BodyText style={{ maxWidth: 760 }}>
                  记录频率、情绪走势、完成度和 AI 摘要组织成连续视角。
                </BodyText>
              </div>
            </Surface>
          </MotionDiv>
        </Container>

        <Container id="auth" style={{ paddingBottom: 80 }}>
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
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
                  <SectionTitle>注册后设备自动登录。</SectionTitle>
                </div>
                <MotionDiv whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <PrimaryButton onClick={onStart}>进入注册</PrimaryButton>
                </MotionDiv>
              </div>
            </Surface>
          </MotionDiv>
        </Container>
      </main>
    </AppFrame>
  )
}
