#!/usr/bin/env bash
# GoMarcha — Install weekly backup as macOS launchd agent.
#
# What this script does:
#   1. Detects absolute paths for node and the project root
#   2. Writes ~/Library/LaunchAgents/com.gomarcha.weekly-backup.plist
#   3. Loads the agent with launchctl
#   4. Prints confirmation and next-run time
#
# Requirements:
#   - .env.backup.local must exist in the project root (see .env.backup.example)
#   - node must be in PATH
#
# Run with:
#   bash scripts/install-weekly-backup-macos.sh
#
# To uninstall:
#   launchctl unload ~/Library/LaunchAgents/com.gomarcha.weekly-backup.plist
#   rm ~/Library/LaunchAgents/com.gomarcha.weekly-backup.plist

set -euo pipefail

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST_LABEL="com.gomarcha.weekly-backup"
PLIST_PATH="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_DIR="${HOME}/Library/Logs"
LOG_OUT="${LOG_DIR}/gomarcha-backup.log"
LOG_ERR="${LOG_DIR}/gomarcha-backup-error.log"
ENV_FILE="${PROJECT_ROOT}/.env.backup.local"
BACKUP_SCRIPT="${PROJECT_ROOT}/scripts/backup-marcha.js"

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
echo "GoMarcha — Weekly Backup Installer"
echo "==================================="
echo ""

# Check node
NODE_PATH="$(which node 2>/dev/null || true)"
if [[ -z "${NODE_PATH}" ]]; then
  echo "ERROR: node not found in PATH."
  echo "Install Node.js (https://nodejs.org) and re-run."
  exit 1
fi
echo "  node       : ${NODE_PATH} ($(node --version))"

# Check .env.backup.local
if [[ ! -f "${ENV_FILE}" ]]; then
  echo ""
  echo "ERROR: ${ENV_FILE} not found."
  echo "Copy .env.backup.example → .env.backup.local and fill in your values:"
  echo "  cp .env.backup.example .env.backup.local"
  exit 1
fi
echo "  env file   : ${ENV_FILE} ✓"

# Check backup script
if [[ ! -f "${BACKUP_SCRIPT}" ]]; then
  echo ""
  echo "ERROR: ${BACKUP_SCRIPT} not found."
  exit 1
fi
echo "  backup.js  : ${BACKUP_SCRIPT} ✓"
echo "  project    : ${PROJECT_ROOT}"
echo "  plist      : ${PLIST_PATH}"
echo "  log stdout : ${LOG_OUT}"
echo "  log stderr : ${LOG_ERR}"
echo ""

# ---------------------------------------------------------------------------
# Unload existing agent if present
# ---------------------------------------------------------------------------
if [[ -f "${PLIST_PATH}" ]]; then
  echo "  Existing plist found — unloading first ..."
  launchctl unload "${PLIST_PATH}" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# Write plist
# Secrets are NOT stored here. The backup script reads .env.backup.local itself.
# ---------------------------------------------------------------------------
mkdir -p "${HOME}/Library/LaunchAgents"

cat > "${PLIST_PATH}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- GoMarcha weekly backup — runs every Monday at 02:00 -->
  <key>Label</key>
  <string>${PLIST_LABEL}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${NODE_PATH}</string>
    <string>${BACKUP_SCRIPT}</string>
  </array>

  <!-- WorkingDirectory must be project root so .env.backup.local is found -->
  <key>WorkingDirectory</key>
  <string>${PROJECT_ROOT}</string>

  <!-- Weekly: Monday 02:00 local time -->
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key>
    <integer>1</integer>
    <key>Hour</key>
    <integer>2</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>${LOG_OUT}</string>

  <key>StandardErrorPath</key>
  <string>${LOG_ERR}</string>

  <!-- Retry once if the machine was asleep at trigger time -->
  <key>RunAtLoad</key>
  <false/>

</dict>
</plist>
PLIST

echo "  plist written ✓"

# ---------------------------------------------------------------------------
# Load the agent
# ---------------------------------------------------------------------------
launchctl load "${PLIST_PATH}"
echo "  launchd agent loaded ✓"

# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------
echo ""
if launchctl list | grep -q "${PLIST_LABEL}"; then
  echo "SUCCESS: Agent '${PLIST_LABEL}' is registered."
else
  echo "WARNING: Agent loaded but not visible in launchctl list yet."
  echo "  This is normal on macOS 13+ with user agents. Check with:"
  echo "  launchctl print gui/\$(id -u)/${PLIST_LABEL}"
fi

echo ""
echo "Schedule : Every Monday at 02:00 local time"
echo "Logs     : ${LOG_OUT}"
echo "          ${LOG_ERR}"
echo ""
echo "To uninstall:"
echo "  launchctl unload ${PLIST_PATH}"
echo "  rm ${PLIST_PATH}"
echo ""
echo "To test immediately (runs backup now):"
echo "  launchctl start ${PLIST_LABEL}"
echo "  # or: npm run backup"
