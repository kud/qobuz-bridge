import assert from "node:assert/strict"
import { test } from "node:test"
import { hasSwiftToolchain } from "../src/launchd.ts"

test("detects a working swiftc", async () => {
  const calls: Array<[string, string[]]> = []
  const ok = await hasSwiftToolchain(async (file, args) => {
    calls.push([file, args])
  })
  assert.equal(ok, true)
  assert.deepEqual(calls, [["swiftc", ["--version"]]])
})

test("reports a missing toolchain instead of throwing", async () => {
  const ok = await hasSwiftToolchain(async () => {
    throw Object.assign(new Error("spawn swiftc ENOENT"), { code: "ENOENT" })
  })
  assert.equal(ok, false)
})
