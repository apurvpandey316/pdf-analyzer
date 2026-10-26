// Date helpers for daily stats. "Today" depends on the user's timezone,
// so the client sends its IANA timezone (e.g. "Asia/Kolkata").

export function safeTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return tz
  } catch {
    return 'UTC'
  }
}

// "YYYY-MM-DD" for a moment in a timezone.
export function localDateString(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

// The moment the user's current local day ends (next local midnight).
export function endOfLocalDay(now, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(now)
      .map((p) => [p.type, Number(p.value)]),
  )
  const elapsedMs = ((parts.hour * 60 + parts.minute) * 60 + parts.second) * 1000 + now.getMilliseconds()
  return new Date(now.getTime() - elapsedMs + 24 * 60 * 60 * 1000)
}

function previousDay(dateString) {
  const d = new Date(`${dateString}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// Consecutive days with at least one review, ending today.
// If nothing was reviewed today yet, the streak still counts up to yesterday.
export function computeStreak(studyDays, today) {
  const days = new Set(studyDays)
  let day = days.has(today) ? today : previousDay(today)
  let streak = 0
  while (days.has(day)) {
    streak++
    day = previousDay(day)
  }
  return streak
}
