import { readdirSync, readFileSync } from "node:fs"
import { extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url))
const SCANNED_FOLDERS = ["lib", "app", "components", "scripts"]
const SCANNED_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".css"])

const character = (codePoint) => String.fromCodePoint(codePoint)
const characterRange = (first, last) => `${character(first)}-${character(last)}`

const INVISIBLE_CHARACTERS = [
  character(0x00ad),
  characterRange(0x200b, 0x200f),
  character(0x2028),
  character(0x2029),
  characterRange(0x202a, 0x202e),
  characterRange(0x2066, 0x2069),
  character(0xfeff),
].join("")

const INVISIBLE = new RegExp(`[${INVISIBLE_CHARACTERS}]`, "gu")

const codePointLabel = (value) => `U+${value.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`

const sourceFiles = SCANNED_FOLDERS.flatMap((folder) =>
  readdirSync(join(REPO_ROOT, folder), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && SCANNED_EXTENSIONS.has(extname(entry.name)))
    .map((entry) => join(entry.parentPath, entry.name)),
).sort()

const hits = sourceFiles.flatMap((file) =>
  readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) =>
      [...line.matchAll(INVISIBLE)].map(
        (match) => `${relative(REPO_ROOT, file)}:${index + 1}:${match.index + 1} ${codePointLabel(match[0])}`,
      ),
    ),
)

if (hits.length > 0) {
  console.error(`FAIL invisible or format characters in source, write them from code points instead\n  ${hits.join("\n  ")}`)
  process.exit(1)
}

console.log(`ok, no invisible characters in ${sourceFiles.length} files`)
