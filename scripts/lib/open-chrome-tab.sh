#!/usr/bin/env bash
# Open a URL in Chrome, reusing (and refreshing) an existing tab on the same
# host:port instead of spawning a new one. Falls back to opening a new tab
# if no matching tab is found or Chrome isn't running.
#
# Usage: open-chrome-tab.sh <url>
set -euo pipefail

URL="$1"
HOST_PORT=$(echo "$URL" | sed -E 's#^[a-zA-Z]+://([^/]+).*#\1#')

osascript <<EOF 2>/dev/null || open -a "Google Chrome" "$URL"
tell application "Google Chrome"
  set targetURL to "$URL"
  set targetHostPort to "$HOST_PORT"
  set foundWindowIndex to 0
  set foundTabIndex to 0

  set windowCount to count of windows
  repeat with wi from 1 to windowCount
    set tabCount to count of tabs of window wi
    repeat with ti from 1 to tabCount
      if (URL of tab ti of window wi contains targetHostPort) then
        set foundWindowIndex to wi
        set foundTabIndex to ti
        exit repeat
      end if
    end repeat
    if foundWindowIndex is not 0 then exit repeat
  end repeat

  if foundWindowIndex is not 0 then
    set URL of tab foundTabIndex of window foundWindowIndex to targetURL
    reload tab foundTabIndex of window foundWindowIndex
    set active tab index of window foundWindowIndex to foundTabIndex
    set index of window foundWindowIndex to 1
  else
    if (count of windows) is 0 then
      make new window
    end if
    tell window 1 to make new tab with properties {URL:targetURL}
  end if

  activate
end tell
EOF
