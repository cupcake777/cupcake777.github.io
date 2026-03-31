import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"

test("homepage advertises Cat Journal as a first-class project entry", async () => {
  const homepage = await fs.readFile(new URL("../cc-site/content/index.md", import.meta.url), "utf8")

  assert.match(homepage, /\/projects\/cat-journal\//)
  assert.match(homepage, /Cat Journal/)
})
