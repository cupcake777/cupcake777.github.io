import test from "node:test"
import assert from "node:assert/strict"

import viteConfig from "../vite.config.js"

test("vite config defines manual chunk strategy for heavy frontend dependencies", () => {
  const manualChunks = viteConfig.build?.rollupOptions?.output?.manualChunks

  assert.equal(typeof manualChunks, "function")
  assert.equal(manualChunks("/tmp/project/node_modules/react/index.js"), "react-vendor")
  assert.equal(manualChunks("/tmp/project/node_modules/react-dom/client.js"), "react-vendor")
  assert.equal(manualChunks("/tmp/project/node_modules/framer-motion/dist/es/index.mjs"), "motion")
  assert.equal(manualChunks("/tmp/project/node_modules/@supabase/supabase-js/dist/module/index.js"), "supabase")
  assert.equal(manualChunks("/tmp/project/node_modules/lucide-react/dist/esm/icons.js"), "icons")
  assert.equal(manualChunks("/tmp/project/src/components/App/MainApp.jsx"), undefined)
})
