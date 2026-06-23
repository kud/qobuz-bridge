import { createKeychainStore, createQobuzClient } from "@kud/qobuz"
import { sendMediaKey } from "@kud/macos-media-keys"
import { createNowPlayingBridge } from "@kud/macos-nowplaying-bridge"
import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { install, uninstall } from "./launchd.js"

const PLAYER_STATE_PATH = join(
  homedir(),
  "Library/Application Support/Qobuz/player-0.json",
)
const POLL_INTERVAL_MS = 3000

// @kud/qobuz resolves the track but not playback position; read it straight
// from the player state file (player.position.value is milliseconds).
const readElapsedSeconds = async (): Promise<number> => {
  try {
    const state = JSON.parse(await readFile(PLAYER_STATE_PATH, "utf8"))
    const player = state?.player?.data ?? state?.player ?? {}
    return (player?.position?.value ?? 0) / 1000
  } catch {
    return 0
  }
}

const logError = (error: unknown) => console.error(String(error))

const run = async () => {
  if (process.platform !== "darwin") {
    throw new Error("@kud/qobuz-bridge only works on macOS")
  }

  const client = await createQobuzClient({ store: createKeychainStore() })
  const bridge = await createNowPlayingBridge()

  // Control Center buttons → Qobuz, via the system media keys its event tap catches.
  bridge.on("next", () => void sendMediaKey("next").catch(logError))
  bridge.on("previous", () => void sendMediaKey("previous").catch(logError))
  for (const event of ["play", "pause", "toggle"] as const) {
    bridge.on(event, () => void sendMediaKey("play").catch(logError))
  }

  let lastTrackId: number | undefined
  const tick = async () => {
    const track = await client.nowPlaying().catch(() => undefined)
    if (!track || track.id === lastTrackId) return
    lastTrackId = track.id
    bridge.update({
      title: track.title,
      artist: track.artist?.name,
      album: track.album?.title,
      artworkUrl: track.album?.image?.large ?? track.album?.image?.small,
      duration: track.duration,
      elapsed: await readElapsedSeconds(),
      rate: 1,
      state: "playing",
    })
    console.log(`now playing → ${track.title} — ${track.artist?.name ?? "?"}`)
  }

  const shutdown = () => {
    bridge.stop()
    process.exit(0)
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)

  await tick()
  setInterval(() => void tick(), POLL_INTERVAL_MS)
  console.log("qobuz-bridge running — open Control Center. Ctrl-C to quit.")
}

const main = async () => {
  const command = process.argv[2]
  if (command === "install") return install()
  if (command === "uninstall") return uninstall()
  return run()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
