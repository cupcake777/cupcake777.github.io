import { useEffect, useMemo, useState } from "react"
import {
  Brain,
  ChartColumnBig,
  FlaskConical,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from "lucide-react"
import { AISettingsModal, getAIConfig, useAISettings } from "../AISettings"
import { PRIMARY_TABS, TOOL_MENU_ITEMS } from "../../config/site"
import { db } from "../../lib/storage"
import {
  normalizeDigests,
  normalizeProfile,
  normalizeRecord,
  normalizeResearch,
  toText,
} from "../../lib/normalize"
import {
  buildAIContext,
  createDraftRecord,
  createEmptyProfile,
  createEmptyResearch,
  makeRecordPayload,
  summarizeRecords,
} from "../../lib/journal"
import { BodyText, Container, SectionEyebrow, SectionTitle, Surface } from "../ui/primitives"
import { uiTokens } from "../ui/tokens"
import { TodayPage } from "./TodayPage"
import { TimelinePage } from "./TimelinePage"
import { InsightsPage } from "./InsightsPage"
import { AIPage } from "./AIPage"
import { MyPage } from "./MyPage"
import { CatAvatar } from "../CatAvatar"
import { FloatingCat } from "../FloatingCat"
import { motion } from "framer-motion"

const TAB_ICONS = {
  today: SunMedium,
  timeline: ScrollText,
  insights: ChartColumnBig,
  ai: Sparkles,
  me: UserRound,
}

async function requestAI(prompt, profile, research, records) {
  const { provider, apiKey } = getAIConfig()
  if (!apiKey) {
    return "还没有配置 AI API Key，请先在工具菜单中完成设置。"
  }

  const context = buildAIContext(profile, research, records)
  const name = profile?.name || "用户"
  const fullPrompt = `你是 ${name} 的私人记录助手。\n\n${context}\n\n用户请求：${prompt}\n\n请用中文回答，保持温和、具体、不过度夸张。`

  try {
    if (provider === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] }),
        },
      )
      const data = await response.json()
      return toText(data?.candidates?.[0]?.content?.parts?.[0]?.text, "AI 返回内容为空。")
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        messages: [{ role: "user", content: fullPrompt }],
      }),
    })
    const data = await response.json()
    return toText(data?.content?.map((item) => item.text || "").join(""), "AI 返回内容为空。")
  } catch (error) {
    console.error("AI request failed", error)
    return "AI 请求失败，请检查 API Key、网络或提供商设置。"
  }
}

function ToolMenu({ onAction, onClose }) {
  return (
    <Surface
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 220,
        padding: 10,
        zIndex: 30,
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        {TOOL_MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onAction(item.key)
              onClose()
            }}
            style={{
              minHeight: 42,
              borderRadius: 14,
              border: "none",
              background: "transparent",
              color: uiTokens.color.textStrong,
              cursor: "pointer",
              textAlign: "left",
              paddingInline: 12,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </Surface>
  )
}

function ResearchPanel({ value, onChange, onSave, onClose, saving }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18, 35, 27, 0.24)",
        display: "grid",
        placeItems: "center",
        zIndex: 40,
        padding: 20,
      }}
      onClick={onClose}
    >
      <Surface
        style={{ width: "min(720px, 100%)", padding: 24 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <SectionEyebrow>// research</SectionEyebrow>
              <SectionTitle style={{ fontSize: 24 }}>研究模块已收进工具菜单</SectionTitle>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: uiTokens.color.textMuted,
              }}
            >
              <X size={20} />
            </button>
          </div>
          <BodyText>
            这部分不再和“今日记录”处在同一层导航。这里只保留必要的研究背景，供 AI
            和你自己在回看时参考。
          </BodyText>
          <label style={{ display: "grid", gap: 8 }}>
            <span>研究主题</span>
            <input
              value={value.topic}
              onChange={(event) => onChange({ ...value, topic: event.target.value })}
              placeholder="例如：APA 动态模式、论文修回、图表整理"
              style={{
                minHeight: 46,
                borderRadius: 16,
                border: `1px solid ${uiTokens.color.surfaceBorder}`,
                padding: "12px 14px",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span>研究描述</span>
            <textarea
              value={value.description}
              onChange={(event) => onChange({ ...value, description: event.target.value })}
              placeholder="这部分现在对你最重要的上下文是什么"
              style={{
                minHeight: 140,
                borderRadius: 16,
                border: `1px solid ${uiTokens.color.surfaceBorder}`,
                padding: "12px 14px",
                resize: "vertical",
              }}
            />
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: `1px solid ${uiTokens.color.surfaceBorder}`,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              关闭
            </button>
            <button
              onClick={onSave}
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 14,
                border: "none",
                background: uiTokens.color.accent,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {saving ? "保存中..." : "保存研究信息"}
            </button>
          </div>
        </div>
      </Surface>
    </div>
  )
}

export function WorkspaceShell({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("today")
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [profile, setProfile] = useState(createEmptyProfile())
  const [profileSaving, setProfileSaving] = useState(false)
  const [research, setResearch] = useState(createEmptyResearch())
  const [researchSaving, setResearchSaving] = useState(false)
  const [digests, setDigests] = useState({})
  const [draft, setDraft] = useState(createDraftRecord())
  const [savePending, setSavePending] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [search, setSearch] = useState("")
  const [digestMode, setDigestMode] = useState("week")
  const [digestLoading, setDigestLoading] = useState(false)
  const [digestText, setDigestText] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const aiSettings = useAISettings()

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [profileData, researchData, recordsData, digestData] = await Promise.all([
          db.loadProfile(),
          db.loadResearch(),
          db.loadRecords(),
          db.loadDigests(),
        ])

        if (cancelled) return

        const safeRecords = Array.isArray(recordsData)
          ? recordsData.map((record) => normalizeRecord(record)).sort((a, b) => b.ts - a.ts)
          : []

        setProfile(normalizeProfile(profileData) || createEmptyProfile())
        setResearch(normalizeResearch(researchData || createEmptyResearch()))
        setRecords(safeRecords)
        setSelectedRecord(safeRecords[0] || null)
        setDigests(normalizeDigests(digestData))
      } catch (error) {
        console.error("Failed to load workspace data", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [user])

  const summary = useMemo(() => summarizeRecords(records), [records])
  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return records
    return records.filter((record) =>
      [record.activity, record.nextPlan, record.mood?.label, record.mental, record.physical]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    )
  }, [records, search])

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedRecord(null)
      return
    }
    if (!selectedRecord || !filteredRecords.some((record) => record.id === selectedRecord.id)) {
      setSelectedRecord(filteredRecords[0])
    }
  }, [filteredRecords, selectedRecord])

  const digestKey = `${digestMode}-${new Date().getFullYear()}-${new Date().getMonth() + 1}`
  const digestStatus = digests[digestKey]
    ? `已缓存 ${digestMode === "week" ? "周报" : "月报"}，可以重新生成。`
    : `当前还没有生成${digestMode === "week" ? "周报" : "月报"}。`

  useEffect(() => {
    setDigestText(toText(digests[digestKey]?.text, ""))
  }, [digestKey, digests])

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSaveDraft = async () => {
    if (!draft.activity.trim() || !draft.nextPlan.trim() || !draft.mood) return
    setSavePending(true)
    try {
      const payload = makeRecordPayload(draft)
      const saved = await db.saveRecord(payload)
      const normalized = normalizeRecord(saved || payload)
      setRecords((current) => [normalized, ...current])
      setDraft(createDraftRecord())
      setSelectedRecord(normalized)
      setActiveTab("today")
    } catch (error) {
      console.error("Failed to save record", error)
    } finally {
      setSavePending(false)
    }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      await db.saveProfile(profile)
      setProfile((current) => normalizeProfile({ ...current, setupDone: true }))
    } catch (error) {
      console.error("Failed to save profile", error)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveResearch = async () => {
    setResearchSaving(true)
    try {
      await db.saveResearch(research)
      setResearch((current) => normalizeResearch(current))
      setResearchOpen(false)
    } catch (error) {
      console.error("Failed to save research", error)
    } finally {
      setResearchSaving(false)
    }
  }

  const handleGenerateDigest = async () => {
    if (!records.length) return
    setDigestLoading(true)
    const prompt = `请根据我最近的记录，生成一段${digestMode === "week" ? "周报" : "月报"}。重点概括节奏、状态和下一步建议，控制在 220 字内。`
    const text = await requestAI(prompt, profile, research, records)
    const nextDigests = {
      ...digests,
      [digestKey]: { text, ts: Date.now(), period: digestMode },
    }
    setDigestText(text)
    setDigests(nextDigests)
    try {
      await db.saveDigests(nextDigests)
    } catch (error) {
      console.error("Failed to save digest", error)
    } finally {
      setDigestLoading(false)
    }
  }

  const handleAskAI = async () => {
    setAiLoading(true)
    const answer = await requestAI(aiPrompt, profile, research, records)
    setAiAnswer(answer)
    setAiLoading(false)
  }

  const handleMenuAction = (key) => {
    if (key === "research") {
      setResearchOpen(true)
      return
    }
    if (key === "ai-settings") {
      aiSettings.setIsOpen(true)
      return
    }
    if (key === "account") {
      setActiveTab("me")
    }
  }

  const renderActivePage = () => {
    if (activeTab === "today") {
      return (
        <TodayPage
          profile={profile}
          records={records}
          draft={draft}
          onDraftChange={handleDraftChange}
          onResetDraft={() => setDraft(createDraftRecord())}
          onSaveDraft={handleSaveDraft}
          savePending={savePending}
          onOpenTimeline={() => setActiveTab("timeline")}
          onOpenInsights={() => setActiveTab("insights")}
        />
      )
    }

    if (activeTab === "timeline") {
      return (
        <TimelinePage
          records={filteredRecords}
          selectedRecord={selectedRecord}
          onSelect={setSelectedRecord}
          search={search}
          onSearchChange={setSearch}
        />
      )
    }

    if (activeTab === "insights") {
      return (
        <InsightsPage
          summary={summary}
          records={records}
          digestMode={digestMode}
          onDigestModeChange={setDigestMode}
          digestText={digestText}
          digestLoading={digestLoading}
          onGenerateDigest={handleGenerateDigest}
          digestStatus={digestStatus}
        />
      )
    }

    if (activeTab === "ai") {
      return (
        <AIPage
          prompt={aiPrompt}
          onPromptChange={setAiPrompt}
          onAsk={handleAskAI}
          answer={aiAnswer}
          loading={aiLoading}
          hasConfig={Boolean(aiSettings.apiKey)}
        />
      )
    }

    return (
      <MyPage
        profile={profile}
        onProfileChange={(key, value) => setProfile((current) => ({ ...current, [key]: value }))}
        onSaveProfile={handleSaveProfile}
        profileSaving={profileSaving}
        onLogout={onLogout}
      />
    )
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: uiTokens.color.base,
        }}
      >
        <Surface tint style={{ padding: 24 }}>
          <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
            <SectionEyebrow>// loading</SectionEyebrow>
            <SectionTitle style={{ fontSize: 24 }}>正在整理你的工作台</SectionTitle>
          </div>
        </Surface>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100dvh", background: uiTokens.color.base, paddingBottom: 92 }}>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 25,
          backdropFilter: "blur(20px)",
          background: "rgba(255, 253, 250, 0.85)",
          borderBottom: `1px solid ${uiTokens.color.surfaceBorder}`,
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <Container style={{ paddingBlock: 14 }}>
          <Surface tint style={{ padding: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CatAvatar mood={records[0]?.mood?.value || "calm"} size={50} />
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ fontFamily: uiTokens.font.mono, fontSize: 14 }}>
                    cat journal
                  </strong>
                  <span style={{ color: uiTokens.color.textMuted, fontSize: 13 }}>
                    {summary.hasToday
                      ? `今天已记录 ${summary.todayRecords.length} 条`
                      : "今天还没有记录"}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginLeft: "auto",
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("timeline")}
                  style={{
                    minHeight: 42,
                    borderRadius: 14,
                    border: `1px solid ${uiTokens.color.accentBorder}`,
                    background: uiTokens.color.surface,
                    color: uiTokens.color.textMuted,
                    padding: "0 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Search size={16} />
                  搜索记录
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("today")}
                  style={{
                    minHeight: 42,
                    borderRadius: 14,
                    border: "none",
                    background: uiTokens.color.accent,
                    color: "#fff",
                    padding: "0 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Sparkles size={16} />
                  快速新增
                </motion.button>
                <div style={{ position: "relative" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMenuOpen((open) => !open)}
                    style={{
                      minHeight: 42,
                      minWidth: 42,
                      borderRadius: 14,
                      border: `1px solid ${uiTokens.color.accentBorder}`,
                      background: uiTokens.color.surface,
                      color: uiTokens.color.textStrong,
                      cursor: "pointer",
                    }}
                  >
                    <Menu size={18} />
                  </motion.button>
                  {menuOpen ? (
                    <ToolMenu onAction={handleMenuAction} onClose={() => setMenuOpen(false)} />
                  ) : null}
                </div>
              </div>
            </div>
          </Surface>
        </Container>
      </motion.header>

      <main>
        <Container style={{ paddingTop: 24 }}>{renderActivePage()}</Container>
      </main>

      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 26,
          borderTop: `1px solid ${uiTokens.color.surfaceBorder}`,
          background: "rgba(255, 253, 250, 0.94)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Container
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${PRIMARY_TABS.length}, minmax(0, 1fr))`,
            gap: 8,
            paddingBlock: 10,
          }}
        >
          {PRIMARY_TABS.map((item) => {
            const Icon = TAB_ICONS[item.key]
            const active = activeTab === item.key

            return (
              <motion.button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: active ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  minHeight: 54,
                  borderRadius: 18,
                  border: `1px solid ${active ? uiTokens.color.accentBorder : "transparent"}`,
                  background: active ? uiTokens.color.accentSoft : "transparent",
                  color: active ? uiTokens.color.textStrong : uiTokens.color.textMuted,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  gap: 3,
                }}
              >
                <Icon size={18} />
                <span style={{ fontSize: 12 }}>{item.label}</span>
              </motion.button>
            )
          })}
        </Container>
      </motion.nav>

      {researchOpen ? (
        <ResearchPanel
          value={research}
          onChange={setResearch}
          onSave={handleSaveResearch}
          onClose={() => setResearchOpen(false)}
          saving={researchSaving}
        />
      ) : null}

      <AISettingsModal
        isOpen={aiSettings.isOpen}
        onClose={() => aiSettings.setIsOpen(false)}
        settings={aiSettings}
      />

      <FloatingCat records={records} />
    </div>
  )
}
