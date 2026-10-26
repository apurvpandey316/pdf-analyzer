import Card from '../models/Card.js'
import ReviewLog from '../models/ReviewLog.js'
import { computeStreak, endOfLocalDay, localDateString, safeTimeZone } from '../services/stats.js'

const STREAK_LOOKBACK_DAYS = 400

// GET /api/stats?tz=Asia/Kolkata
export async function getStats(req, res) {
  const timeZone = safeTimeZone(req.query.tz)
  const now = new Date()
  const today = localDateString(now, timeZone)
  const userId = req.user._id

  const [studyDayRows, dueNow, dueToday, totalCards, reviewedToday] = await Promise.all([
    ReviewLog.aggregate([
      {
        $match: {
          user: userId,
          reviewedAt: { $gte: new Date(now - STREAK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000) },
        },
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt', timezone: timeZone } } } },
    ]),
    Card.countDocuments({ user: userId, dueDate: { $lte: now } }),
    Card.countDocuments({ user: userId, dueDate: { $lt: endOfLocalDay(now, timeZone) } }),
    Card.countDocuments({ user: userId }),
    ReviewLog.aggregate([
      { $match: { user: userId, reviewedAt: { $gte: new Date(now - 26 * 60 * 60 * 1000) } } },
      { $project: { day: { $dateToString: { format: '%Y-%m-%d', date: '$reviewedAt', timezone: timeZone } } } },
      { $match: { day: today } },
      { $count: 'n' },
    ]),
  ])

  res.json({
    streak: computeStreak(
      studyDayRows.map((r) => r._id),
      today,
    ),
    reviewedToday: reviewedToday[0]?.n ?? 0,
    dueNow,
    dueToday,
    totalCards,
    credits: req.user.credits,
  })
}
