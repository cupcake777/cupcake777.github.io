/* eslint-disable react-refresh/only-export-components */
import { useState } from "react"
import { Info, Key, Settings, X } from "lucide-react"
import { uiTokens } from "./ui/tokens"

const AI_PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { id: "gemini", name: "Google Gemini", placeholder: "AIza..." },
]

export function useAISettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState(() => localStorage.getItem("cat-journal-ai-provider") || "anthropic")
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("cat-journal-ai-key") || "")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    localStorage.setItem("cat-journal-ai-provider", provider)
    localStorage.setItem("cat-journal-ai-key", apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    setIsOpen(false)
  }

  const handleClear = () => {
    localStorage.removeItem("cat-journal-ai-provider")
    localStorage.removeItem("cat-journal-ai-key")
    setProvider("anthropic")
    setApiKey("")
  }

  return {
    isOpen,
    setIsOpen,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    saved,
    handleSave,
    handleClear,
  }
}

export function AISettingsButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 42,
        minWidth: 42,
        borderRadius: 14,
        border: `1px solid ${uiTokens.color.accentBorder}`,
        background: uiTokens.color.surface,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        color: uiTokens.color.textStrong,
      }}
      title="AI 设置"
    >
      <Settings size={18} />
    </button>
  )
}

export function AISettingsModal({ isOpen, onClose, settings }) {
  if (!isOpen) return null

  const { provider, setProvider, apiKey, setApiKey, saved, handleSave, handleClear } = settings

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(18, 35, 27, 0.24)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(460px, 100%)",
          borderRadius: 24,
          border: `1px solid ${uiTokens.color.surfaceBorder}`,
          background: uiTokens.color.surface,
          boxShadow: uiTokens.shadow.card,
          padding: 24,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ color: uiTokens.color.accent, fontFamily: uiTokens.font.mono, fontSize: 12 }}>
              // ai settings
            </span>
            <strong style={{ fontSize: 24, color: uiTokens.color.textStrong, fontFamily: uiTokens.font.heading }}>
              配置你的 AI 提供商
            </strong>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: uiTokens.color.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 16,
            border: `1px solid ${uiTokens.color.accentBorder}`,
            background: uiTokens.color.accentSoft,
            color: uiTokens.color.textMuted,
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>API Key 仅保存在当前浏览器本地，用于生成摘要和 AI 辅助回复。</span>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: uiTokens.color.textStrong, fontWeight: 600 }}>AI 提供商</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {AI_PROVIDERS.map((item) => {
                const active = provider === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setProvider(item.id)}
                    style={{
                      minHeight: 46,
                      borderRadius: 16,
                      border: `1px solid ${active ? uiTokens.color.accentBorder : uiTokens.color.surfaceBorder}`,
                      background: active ? uiTokens.color.accentSoft : uiTokens.color.surface,
                      cursor: "pointer",
                      color: uiTokens.color.textStrong,
                    }}
                  >
                    {item.name}
                  </button>
                )
              })}
            </div>
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: uiTokens.color.textStrong, fontWeight: 600 }}>API Key</span>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={AI_PROVIDERS.find((item) => item.id === provider)?.placeholder}
                style={{
                  width: "100%",
                  minHeight: 48,
                  borderRadius: 16,
                  border: `1px solid ${uiTokens.color.surfaceBorder}`,
                  padding: "12px 14px 12px 42px",
                  fontFamily: uiTokens.font.mono,
                }}
              />
              <Key
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: uiTokens.color.textMuted,
                }}
              />
            </div>
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleClear}
            style={{
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 14,
              border: `1px solid ${uiTokens.color.surfaceBorder}`,
              background: "transparent",
              cursor: "pointer",
              color: uiTokens.color.textMuted,
            }}
          >
            清除
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            style={{
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 14,
              border: "none",
              background: apiKey.trim() ? uiTokens.color.accent : uiTokens.color.surfaceBorder,
              color: apiKey.trim() ? "#fff" : uiTokens.color.textMuted,
              cursor: apiKey.trim() ? "pointer" : "not-allowed",
            }}
          >
            {saved ? "已保存" : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function getAIConfig() {
  const provider = localStorage.getItem("cat-journal-ai-provider") || "anthropic"
  const apiKey = localStorage.getItem("cat-journal-ai-key") || ""
  return { provider, apiKey }
}
