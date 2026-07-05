import ApplicationServices
import Foundation

// The executable inside Qobuz Bridge.app. Its whole reason to exist is identity:
// launchd runs *this* (a signed, bundled app), and the node process it spawns —
// plus the media-key helper node spawns in turn — inherit its responsibility.
// So macOS attributes both the Accessibility grant and the Now Playing tile to
// "Qobuz Bridge", not to a bare `node`.

// Registers the app in Privacy & Security → Accessibility and shows the grant
// prompt on first launch. Once granted it returns true silently, so calling it
// every launch is harmless.
let promptKey = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
_ = AXIsProcessTrustedWithOptions([promptKey: true] as CFDictionary)

func fail(_ message: String, _ code: Int32) -> Never {
  FileHandle.standardError.write(Data("qobuz-bridge launcher: \(message)\n".utf8))
  exit(code)
}

// node + script paths are baked into Contents/Resources/config.json at install
// time — the launcher stays generic so it never needs recompiling per machine.
guard let configURL = Bundle.main.url(forResource: "config", withExtension: "json"),
  let data = try? Data(contentsOf: configURL),
  let config = try? JSONSerialization.jsonObject(with: data) as? [String: String],
  let node = config["node"],
  let script = config["script"]
else { fail("could not read config.json from app bundle", 78) }

let task = Process()
task.executableURL = URL(fileURLWithPath: node)
task.arguments = [script]

// When node exits on its own, exit with its status so launchd's KeepAlive
// restarts us cleanly.
task.terminationHandler = { proc in exit(proc.terminationStatus) }

// launchd sends SIGTERM on unload/restart. Without handling it we'd die and
// orphan the node child, which keeps owning the Now Playing slot — that's how
// duplicate bridges piled up. Tear the child down first, then exit. Signal
// sources need SIG_IGN so the default disposition doesn't kill us first, and a
// running main loop so they (and terminationHandler) can fire while we wait.
let sources = [SIGTERM, SIGINT, SIGHUP].map { sig -> DispatchSourceSignal in
  signal(sig, SIG_IGN)
  let source = DispatchSource.makeSignalSource(signal: sig, queue: .main)
  source.setEventHandler {
    if task.isRunning { task.terminate() }
    exit(0)
  }
  source.resume()
  return source
}
_ = sources  // keep the sources alive for the process lifetime

do {
  try task.run()
} catch {
  fail("failed to launch node: \(error)", 71)
}

RunLoop.main.run()
