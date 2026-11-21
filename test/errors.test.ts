import assert from "node:assert/strict"
import { test } from "node:test"
import { createErrorReporter } from "../src/errors.ts"

test("reports each distinct error once", () => {
  const logged: string[] = []
  const reporter = createErrorReporter((m) => logged.push(m))
  reporter.report("token expired")
  reporter.report("token expired")
  reporter.report("token expired")
  reporter.report("network down")
  reporter.report("network down")
  assert.deepEqual(logged, ["token expired", "network down"])
})

test("reports a recurring error again after a success", () => {
  const logged: string[] = []
  const reporter = createErrorReporter((m) => logged.push(m))
  reporter.report("token expired")
  reporter.clear()
  reporter.report("token expired")
  assert.deepEqual(logged, ["token expired", "token expired"])
})
