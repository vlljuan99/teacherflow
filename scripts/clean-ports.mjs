#!/usr/bin/env node
// Frees the dev ports before `next dev` starts.
// Cross-platform: Windows (netstat + taskkill) and macOS/Linux (lsof + kill).

import { execSync } from "node:child_process";
import { platform } from "node:os";

const PORTS = Array.from({ length: 6 }, (_, i) => 3000 + i); // 3000..3005
const isWindows = platform() === "win32";

function pidsOnPort(port) {
  try {
    if (isWindows) {
      const out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        const m = line.match(/\s+TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/);
        if (m && Number(m[1]) === port) pids.add(m[2]);
      }
      return [...pids];
    }
    const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (isWindows) {
      execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

let freed = 0;
for (const port of PORTS) {
  const pids = pidsOnPort(port);
  for (const pid of pids) {
    if (killPid(pid)) {
      console.log(`✓ port ${port} freed (pid ${pid})`);
      freed += 1;
    } else {
      console.log(`✗ port ${port} pid ${pid} could not be killed`);
    }
  }
}
if (freed === 0) console.log("✓ no dev ports in use");
