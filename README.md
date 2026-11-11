<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/npm/v/@kud/qobuz-bridge?style=flat-square&color=CB3837)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**Background daemon that bridges Qobuz into macOS Now Playing — Control Center tile, artwork, and working media buttons**

<a href="https://kud.io/projects/qobuz-bridge">Website</a> · <a href="https://kud.io/projects/qobuz-bridge/docs">Documentation</a>

</div>

## Features

- **Control Center tile** — Qobuz becomes a first-class macOS Now Playing citizen: track title, artist, album, and artwork appear in Control Center just like any native player.
- **Working media buttons** — next, previous, and play/pause from Control Center (or your keyboard's media keys) are routed back to Qobuz via a system-level event tap.
- **Rich artwork** — album art is pulled from Qobuz's CDN and pushed live to the Now Playing slot, updating as tracks change.
- **Auto-start on login** — a single `qobuz-bridge install` builds a small `Qobuz Bridge.app` and registers it as a launchd agent, so the daemon starts automatically at login and restarts if it crashes.
- **Light polling** — every 3 seconds the daemon asks Qobuz what is playing (`client.nowPlaying()` from `@kud/qobuz`) and only updates Control Center when the track changes; elapsed time is read once per track from Qobuz's local `player-0.json` state file.
- **Three-package composition** — thin orchestration layer that wires `@kud/qobuz`, `@kud/macos-nowplaying-bridge`, and `@kud/macos-media-keys` together with no duplicated logic.

## Install

```sh
npm install -g @kud/qobuz-bridge
```

Requires macOS and Node.js ≥ 20, with the Qobuz desktop app installed. `qobuz-bridge install` also needs `swiftc` (the Xcode command line tools) to build its launcher app. Then connect your account once:

```sh
qobuz-bridge login
```

This stores a Qobuz token in the macOS Keychain (service `"qobuz"`, shared with the rest of the `@kud/qobuz` suite — if you've already run `qobuz login` from `@kud/qobuz-cli`, you're connected and can skip this). The token can also be passed as an argument for scripting, `qobuz-bridge login <token>`, at the cost of it landing in your shell history.

Media keys are intercepted with a system event tap, so the `Qobuz Bridge` app that `install` builds in `/Applications` needs Accessibility permission: allow it under System Settings → Privacy & Security → Accessibility when macOS asks.

## Usage

```console
$ qobuz-bridge login
✓ connected — token stored in the Keychain (service "qobuz").
Next: qobuz-bridge install

$ qobuz-bridge
qobuz-bridge running — open Control Center. Ctrl-C to quit.
now playing → Intro — The xx

$ qobuz-bridge install
built app     → /Applications/Qobuz Bridge.app
login item    → ~/Library/LaunchAgents/io.kud.qobuz-bridge.plist
logs          → ~/Library/Logs/qobuz-bridge.log

$ qobuz-bridge uninstall
removed login item → ~/Library/LaunchAgents/io.kud.qobuz-bridge.plist
removed app        → /Applications/Qobuz Bridge.app
```

| Command                  | Effect                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `qobuz-bridge login`     | Connect your Qobuz account; stores a token in Keychain            |
| `qobuz-bridge`           | Run the daemon in the foreground (Ctrl-C to quit)                 |
| `qobuz-bridge install`   | Build the app, register a launchd login item and start it now     |
| `qobuz-bridge uninstall` | Stop the daemon now and delete the login item and the app         |

Logs from the background daemon are written to `~/Library/Logs/qobuz-bridge.log`.

> **Known limitation:** `player-0.json` exposes the playback position but not a discrete play/pause flag, so the bridge reports state as `"playing"` whenever a track is detected. Pause detection will improve once the underlying state file exposes it.

## Development

```sh
git clone https://github.com/kud/qobuz-bridge.git
cd qobuz-bridge
npm install
npm run dev
```

| Script              | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run build`     | Compile TypeScript with tsup |
| `npm run dev`       | Watch mode                   |
| `npm run typecheck` | Type-check without emitting  |
| `npm start`         | Run the compiled output      |

📚 **Full documentation → [qobuz-bridge/docs](https://kud.io/projects/qobuz-bridge/docs)**

## Disclaimer

This is an independent, unofficial project — not affiliated with, endorsed by, or sponsored by Qobuz. "Qobuz", the Qobuz logo, and any icons derived from it are trademarks of Qobuz Music, used here only to indicate compatibility.
