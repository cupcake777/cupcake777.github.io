import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

function manualChunks(id) {
  if (!id.includes("node_modules")) return undefined

  if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("scheduler")) {
    return "react-vendor"
  }

  if (id.includes("/framer-motion/") || id.includes("/motion-dom/")) {
    return "motion"
  }

  if (id.includes("/@supabase/")) {
    return "supabase"
  }

  if (id.includes("/lucide-react/")) {
    return "icons"
  }

  return "vendor"
}

export default defineConfig({
  plugins: [react()],
  base: "/projects/cat-journal/",
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
