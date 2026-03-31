import { useAuth } from "./hooks/useAuth"
import { AuthPage } from "./components/Auth"
import { MainApp } from "./components/App"
import { toText } from "./lib/normalize"

function App() {
  const { user, loading, error, signIn, signUp, signOut } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg,#fdf4ec,#f5e6d8,#ede0d4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🐱</div>
          <p style={{ color: "#9e8472", fontFamily: "sans-serif" }}>加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthPage
        onLogin={signIn}
        onRegister={signUp}
        loading={loading}
        error={toText(error, "")}
      />
    )
  }

  return <MainApp user={user} onLogout={signOut} />
}

export default App
