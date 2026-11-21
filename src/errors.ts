// Polling runs every few seconds, so a persistent failure (an expired token, a
// network outage) would flood the log if reported on every tick. Report each
// distinct message once, and forget it after a success so a later recurrence
// is reported again.
export const createErrorReporter = (log: (message: string) => void) => {
  let last: string | undefined
  return {
    report: (message: string) => {
      if (message === last) return
      last = message
      log(message)
    },
    clear: () => {
      last = undefined
    },
  }
}
