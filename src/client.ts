import { createQobuzClient, type CredentialStore } from "@kud/qobuz"

// @kud/qobuz names this command in its own "not connected" and "log in again"
// errors, so the bridge prints those messages as they are instead of adding a
// hint of its own.
export const LOGIN_COMMAND = "qobuz-bridge login"

export const openClient = (store: CredentialStore) =>
  createQobuzClient({ store, loginCommand: LOGIN_COMMAND })

export const isAuthError = (error: unknown): boolean =>
  (error as { kind?: string } | null)?.kind === "auth"

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)
