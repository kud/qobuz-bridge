import assert from "node:assert/strict"
import { test } from "node:test"
import { createMemoryStore } from "@kud/qobuz"
import {
  errorMessage,
  isAuthError,
  LOGIN_COMMAND,
  openClient,
} from "../src/client.ts"

const occurrences = (text: string, needle: string) =>
  text.split(needle).length - 1

test("the not-logged-in message names qobuz-bridge login exactly once", async () => {
  const error = await openClient(createMemoryStore()).then(
    () => assert.fail("expected openClient to reject without credentials"),
    (error: unknown) => error,
  )
  assert.equal(isAuthError(error), true)
  const message = errorMessage(error)
  assert.equal(LOGIN_COMMAND, "qobuz-bridge login")
  assert.equal(occurrences(message, "qobuz-bridge login"), 1, message)
  assert.equal(occurrences(message, "qobuz login"), 0, message)
})

test("opens a client when credentials are stored", async () => {
  const client = await openClient(
    createMemoryStore({ appId: "app", token: "token" }),
  )
  assert.equal(client.appId, "app")
})
