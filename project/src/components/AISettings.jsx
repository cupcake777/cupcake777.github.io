import { useState, useEffect } from "react"
import { Settings, X, Key, Info } from "lucide-react"

const AI_PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { id: "gemini", name: "Google Gemini", placeholder: "AIza..." },
]

export function useAISettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState("anthropic")
  const [apiKey, setApiKey] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedProvider = localStorage.getItem("cat-journal-ai-provider")
    const savedKey = localStorage.getItem("cat-journal-ai-key")
    if (savedProvider) setProvider(savedProvider)
    if (savedKey) setApiKey(savedKey)
  }, [])

  const handleSave = () => {
    localStorage.setItem("cat-journal-ai-provider", provider)
    localStorage.setItem("cat-journal-ai-key", apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 8,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .2s",
      }}
      title="AI设置"
    >
      <Settings size={22} color="#9e8472" />
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: 22,
          border: "1px solid rgba(196,168,130,0.22)",
          boxShadow: "0 10px 40px rgba(160,120,80,0.15)",
          padding: "28px 24px",
          maxWidth: 420,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes popIn{0%{opacity:0;transform:scale(.95)}100%{opacity:1;transform:scale(1)}        `,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 18,
              color: "#5c4033",
              margin: 0,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Key size={20} />
            AI 设置
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color="#9e8472" />
          </button>
        </div>

        <div
          style={{
            background: "#fff9e6",
            border: "1px solid #ffd97d",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 20,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Info size={18} color="#a67c00" style={{ flexShrink: 0, marginTop: 2 }} />
          <p
            style={{
              fontSize: 13,
              color: "#8a6d00",
              fontFamily: "sans-serif",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            API Key 仅存储在你的浏览器本地，不会上传到服务器。请妥善保管你的密钥。
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: "#9e8472",
              fontFamily: "sans-serif",
              marginBottom: 8,
              display: "block",
              fontWeight: 600,
            }}
          >
            AI 提供商
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  borderRadius: 12,
                  border: `2px solid ${provider === p.id ? "#c4a882" : "#e8d5c0"}`,
                  background: provider === p.id ? "#f5ede4" : "#fdf8f4",
                  color: "#5c4033",
                  fontSize: 13,
                  fontWeight: provider === p.id ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                  transition: "all .2s",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontSize: 12,
              color: "#9e8472",
              fontFamily: "sans-serif",
              marginBottom: 8,
              display: "block",
              fontWeight: 600,
            }}
          >
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={AI_PROVIDERS.find((p) => p.id === provider)?.placeholder}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "2px solid #e8d5c0",
              padding: "12px 14px",
              fontSize: 14,
              fontFamily: "monospace",
              outline: "none",
              background: "#fdf8f4",
              color: "#5c4033",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#c4a882")}
            onBlur={(e) => (e.target.style.borderColor = "#e8d5c0")}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 12,
              border: "2px solid #e8d5c0",
              background: "transparent",
              color: "#9e8472",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "sans-serif",
              transition: "all .2s",
            }}
          >
            清除
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: apiKey.trim() ? "linear-gradient(135deg,#c4a882,#e8b89a)" : "#e8d5c0",
              color: apiKey.trim() ? "white" : "#b0a090",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Noto Serif SC', serif",
              cursor: apiKey.trim() ? "pointer" : "not-allowed",
              transition: "all .2s",
            }}
          >
            {saved ? "✓ 已保存" : "保存设置"}
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
