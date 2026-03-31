import { useState } from "react"
import { AUTH_FLOW } from "./config/site"
import { MainApp } from "./components/App"
import { AuthShell } from "./components/Auth"
import { PublicHome } from "./components/Public/PublicHome"
import { useAuth } from "./hooks/useAuth"
import { toText } from "./lib/normalize"
import { AppFrame, SectionEyebrow, SectionTitle, Surface } from "./components/ui/primitives"

function LoadingScreen() {
  return (
    <AppFrame
      style={{
        display: "grid",
        placeItems: "center",
      }}
    >
      <Surface tint style={{ padding: 28 }}>
        <div style={{ display: "grid", gap: 10, textAlign: "center" }}>
          <SectionEyebrow>// loading</SectionEyebrow>
          <SectionTitle style={{ fontSize: 24 }}>正在检查当前设备会话</SectionTitle>
        </div>
      </Surface>
    </AppFrame>
  )
}

function App() {
  const { user, loading, error, signIn, signUp, signOut } = useAuth()
  const [guestView, setGuestView] = useState("public")
  const [authMode, setAuthMode] = useState(AUTH_FLOW.defaultMode)

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <MainApp user={user} onLogout={signOut} />
  }

  if (guestView === "auth") {
    return (
      <AuthShell
        defaultMode={authMode}
        onLogin={signIn}
        onRegister={signUp}
        loading={loading}
        error={toText(error, "")}
        onBack={() => setGuestView("public")}
      />
    )
  }

  return (
    <PublicHome
      onStart={() => {
        setAuthMode("register")
        setGuestView("auth")
      }}
      onLogin={() => {
        setAuthMode("login")
        setGuestView("auth")
      }}
    />
  )
}

export default App
