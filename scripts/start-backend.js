#!/usr/bin/env node
/**
 * Cross-platform script to start the FastAPI backend (port 8000).
 * Use: node scripts/start-backend.js
 * Requires: backend venv set up (see README).
 */
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const backendDir = path.join(root, "backend");
const isWindows = process.platform === "win32";
const venvPython = isWindows
  ? path.join(backendDir, "venv", "Scripts", "python.exe")
  : path.join(backendDir, "venv", "bin", "python");

const proc = spawn(venvPython, ["-m", "uvicorn", "main:app", "--reload", "--port", "8000"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: isWindows,
});

proc.on("error", (err) => {
  console.error("Failed to start backend:", err.message);
  console.error("\nMake sure you have created the venv:");
  console.error("  cd backend && python -m venv venv");
  console.error("  source venv/bin/activate   # or on Windows: venv\\Scripts\\activate");
  console.error("  pip install -r requirements.txt");
  process.exit(1);
});

proc.on("exit", (code) => {
  process.exit(code ?? 0);
});
