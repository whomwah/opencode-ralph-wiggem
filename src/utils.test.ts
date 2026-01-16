import { describe, expect, test } from "bun:test"
import * as path from "node:path"
import * as os from "node:os"
import * as fs from "node:fs/promises"
import { extractPromiseText, slugify, detectProjectTools } from "./utils"

describe("extractPromiseText", () => {
  test("extracts text from promise tags", () => {
    const input = "Some text <promise>DONE</promise> more text"
    expect(extractPromiseText(input)).toBe("DONE")
  })

  test("trims whitespace from extracted text", () => {
    const input = "<promise>  COMPLETED  </promise>"
    expect(extractPromiseText(input)).toBe("COMPLETED")
  })

  test("collapses internal whitespace", () => {
    const input = "<promise>ALL   TASKS\n\nDONE</promise>"
    expect(extractPromiseText(input)).toBe("ALL TASKS DONE")
  })

  test("returns null when no promise tags present", () => {
    const input = "No promise tags here"
    expect(extractPromiseText(input)).toBeNull()
  })

  test("returns null for empty string", () => {
    expect(extractPromiseText("")).toBeNull()
  })

  test("extracts only first promise tag when multiple present", () => {
    const input = "<promise>FIRST</promise> text <promise>SECOND</promise>"
    expect(extractPromiseText(input)).toBe("FIRST")
  })

  test("handles multiline content in promise tags", () => {
    const input = `<promise>
      Line 1
      Line 2
    </promise>`
    expect(extractPromiseText(input)).toBe("Line 1 Line 2")
  })

  test("handles empty promise tags", () => {
    const input = "<promise></promise>"
    expect(extractPromiseText(input)).toBe("")
  })
})

describe("slugify", () => {
  test("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  test("replaces spaces with hyphens", () => {
    expect(slugify("my cool project")).toBe("my-cool-project")
  })

  test("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world")
  })

  test("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world")
  })

  test("trims hyphens from start and end", () => {
    expect(slugify("---hello---")).toBe("hello")
  })

  test("handles leading and trailing whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world")
  })

  test("limits length to 50 characters", () => {
    const longInput = "a".repeat(100)
    expect(slugify(longInput).length).toBe(50)
  })

  test("handles empty string", () => {
    expect(slugify("")).toBe("")
  })

  test("preserves numbers", () => {
    expect(slugify("version 2.0")).toBe("version-20")
  })

  test("handles underscores", () => {
    expect(slugify("hello_world")).toBe("hello_world")
  })

  test("handles mixed special characters", () => {
    expect(slugify("My API's Test! (v2)")).toBe("my-apis-test-v2")
  })
})

describe("detectProjectTools", () => {
  let tempDir: string

  const createTempDir = async (): Promise<string> => {
    const dir = path.join(os.tmpdir(), `nelson-test-${Date.now()}`)
    await fs.mkdir(dir, { recursive: true })
    return dir
  }

  const cleanup = async (dir: string): Promise<void> => {
    try {
      await fs.rm(dir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  }

  test("detects justfile", async () => {
    tempDir = await createTempDir()
    try {
      await fs.writeFile(path.join(tempDir, "justfile"), "build:\n\techo build")
      const result = await detectProjectTools(tempDir)
      expect(result.hasJustfile).toBe(true)
      expect(result.hasPackageJson).toBe(false)
      expect(result.hasMakefile).toBe(false)
    } finally {
      await cleanup(tempDir)
    }
  })

  test("detects package.json", async () => {
    tempDir = await createTempDir()
    try {
      await fs.writeFile(path.join(tempDir, "package.json"), "{}")
      const result = await detectProjectTools(tempDir)
      expect(result.hasJustfile).toBe(false)
      expect(result.hasPackageJson).toBe(true)
      expect(result.hasMakefile).toBe(false)
    } finally {
      await cleanup(tempDir)
    }
  })

  test("detects Makefile", async () => {
    tempDir = await createTempDir()
    try {
      await fs.writeFile(path.join(tempDir, "Makefile"), "build:\n\techo build")
      const result = await detectProjectTools(tempDir)
      expect(result.hasJustfile).toBe(false)
      expect(result.hasPackageJson).toBe(false)
      expect(result.hasMakefile).toBe(true)
    } finally {
      await cleanup(tempDir)
    }
  })

  test("detects multiple tools", async () => {
    tempDir = await createTempDir()
    try {
      await fs.writeFile(path.join(tempDir, "justfile"), "")
      await fs.writeFile(path.join(tempDir, "package.json"), "{}")
      await fs.writeFile(path.join(tempDir, "Makefile"), "")
      const result = await detectProjectTools(tempDir)
      expect(result.hasJustfile).toBe(true)
      expect(result.hasPackageJson).toBe(true)
      expect(result.hasMakefile).toBe(true)
    } finally {
      await cleanup(tempDir)
    }
  })

  test("returns all false for empty directory", async () => {
    tempDir = await createTempDir()
    try {
      const result = await detectProjectTools(tempDir)
      expect(result.hasJustfile).toBe(false)
      expect(result.hasPackageJson).toBe(false)
      expect(result.hasMakefile).toBe(false)
    } finally {
      await cleanup(tempDir)
    }
  })

  test("handles non-existent directory", async () => {
    const nonExistent = path.join(os.tmpdir(), `non-existent-${Date.now()}`)
    const result = await detectProjectTools(nonExistent)
    expect(result.hasJustfile).toBe(false)
    expect(result.hasPackageJson).toBe(false)
    expect(result.hasMakefile).toBe(false)
  })
})
