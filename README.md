# Sprint Capacity Planner

A lightweight, real-time web tool for tracking team availability during sprint planning. No login required — just share a link and fill in your availability.

---

## Overview

Sprint Capacity Planner lets a team collaboratively mark their availability across each working day of a sprint. It calculates per-day and overall sprint capacity as a percentage, so you can see at a glance how much bandwidth the team actually has before committing to work.

---

## How it works

### For the host

1. Open the app.
2. Enter a **sprint name**, **start date**, and **sprint length** (in working days: 5, 10, 15, or 20).
3. Optionally enter your own name to add yourself as the first participant.
4. Click **Create session** — you'll get a unique shareable URL.
5. Share the URL with the team (e.g. paste it in Slack or your planning doc).

### For participants

1. Open the shared link.
2. Enter your name and click **Join sprint** (or choose **Just view** if you want to observe without adding a row).
3. Click your cells to mark your availability for each day.

---

## Availability states

Each cell cycles through four states on click:

| State | Indicator | Value |
|---|---|---|
| Not set | (blank) | 0 |
| Available | ✓ green | 1.0 |
| Half day | ½ amber | 0.5 |
| Unavailable | ✕ red | 0 |

Click a red ✕ again to return the cell to blank.

You can only edit your own row. Other participants' rows are read-only.

---

## Capacity calculations

**Per-day capacity** is shown in a summary row at the bottom of the table:

```
Day capacity % = sum of availability values for that day ÷ number of participants × 100
```

For example, with 5 participants on a given day: 4 fully available + 1 half day = 4.5 ÷ 5 = **90%**.

**Overall sprint capacity** (shown top-right) is the same calculation across all days and all participants combined. It is expressed as both a percentage and a total person-days figure.

Weekend columns are shown but grayed out and excluded from all calculations.

---

## Sharing & sessions

- Each session has a unique ID embedded in the URL (e.g. `?session=AB12CD`).
- Anyone with the link can view or join the session — there is no authentication.
- The board polls for updates every 3 seconds, so all participants see changes in near real-time.
- Sessions persist for **2 hours** from creation, after which they expire.

---

## Exporting

Click **Export markdown** to generate a clean markdown table you can paste into Confluence, Notion, a GitHub issue, or any planning document. The export includes:

- Per-person availability state for each day
- Daily capacity percentages
- Overall sprint capacity summary

---

## Technical notes

- Built as a single-page HTML/JS application — no framework dependencies.
- Uses shared key-value storage for session state (scoped to the session ID).
- No backend required; all logic runs in the browser.
- Session data is stored with a 2-hour TTL and expires automatically.

---

## Limitations

- No authentication or host controls — anyone with the link can add themselves.
- Sessions are ephemeral; there is no history or archiving.
- Real-time sync is poll-based (every 3 seconds), not push-based.
- Designed for planning sessions, not as a permanent team calendar.