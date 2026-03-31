import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { publishCatJournal } from "../tools/publish-cat-journal.mjs"

test("publishCatJournal replaces destination with current Vite build output", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cat-journal-publish-"))
  const sourceDir = path.join(tmpRoot, "dist")
  const destDir = path.join(tmpRoot, "public", "projects", "cat-journal")

  await fs.mkdir(path.join(sourceDir, "assets"), { recursive: true })
  await fs.mkdir(destDir, { recursive: true })

  await fs.writeFile(path.join(sourceDir, "index.html"), "<html>new build</html>")
  await fs.writeFile(path.join(sourceDir, "assets", "app.js"), "console.log('new')")
  await fs.writeFile(path.join(destDir, "stale.txt"), "old")

  await publishCatJournal({ sourceDir, destDir })

  const destEntries = await fs.readdir(destDir)
  const assetsEntries = await fs.readdir(path.join(destDir, "assets"))
  const indexHtml = await fs.readFile(path.join(destDir, "index.html"), "utf8")

  assert.deepEqual(destEntries.sort(), ["assets", "index.html"])
  assert.deepEqual(assetsEntries, ["app.js"])
  assert.equal(indexHtml, "<html>new build</html>")
})
