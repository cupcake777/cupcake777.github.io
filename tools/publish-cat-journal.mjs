import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_SOURCE_DIR = path.join(ROOT_DIR, "project", "dist")
const DEFAULT_DEST_DIR = path.join(ROOT_DIR, "public", "projects", "cat-journal")

async function assertSourceExists(sourceDir) {
  try {
    const stat = await fs.stat(sourceDir)
    if (!stat.isDirectory()) {
      throw new Error(`Source path is not a directory: ${sourceDir}`)
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Cat Journal build output not found: ${sourceDir}`)
    }
    throw error
  }
}

export async function publishCatJournal({
  sourceDir = DEFAULT_SOURCE_DIR,
  destDir = DEFAULT_DEST_DIR,
} = {}) {
  await assertSourceExists(sourceDir)

  await fs.rm(destDir, { recursive: true, force: true })
  await fs.mkdir(path.dirname(destDir), { recursive: true })
  await fs.cp(sourceDir, destDir, { recursive: true })

  return { sourceDir, destDir }
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isEntrypoint) {
  publishCatJournal()
    .then(({ sourceDir, destDir }) => {
      console.log(`Published Cat Journal from ${sourceDir} to ${destDir}`)
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}
