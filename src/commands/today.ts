import { api } from '../api/client.js';
import { formatSessionTime, createSessionTable } from '../utils/formatting.js';
import chalk from 'chalk';

export async function todayCommand(): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const meetings = await api.getMeetings({ year: currentYear });
  const activeMeetings = meetings.filter((m) => !m.is_cancelled);

  // Find meetings happening this weekend (date_start to date_end overlaps with now)
  const weekendMeetings = activeMeetings.filter((m) => {
    const start = new Date(m.date_start);
    const end = new Date(m.date_end);
    // Allow 2 days before start (thursday showing friday sessions)
    const windowStart = new Date(start);
    windowStart.setDate(windowStart.getDate() - 2);
    return now >= windowStart && now <= end;
  });

  if (weekendMeetings.length === 0) {
    // Check if the next meeting is within the next 3 days
    const nextMeetings = activeMeetings.filter((m) => {
      const start = new Date(m.date_start);
      const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 5;
    });

    if (nextMeetings.length === 0) {
      console.log(chalk.dim('\n  No F1 action this weekend.'));
      const nextUp = activeMeetings.find((m) => new Date(m.date_start) > now);
      if (nextUp) {
        const nextDate = formatSessionTime(nextUp.date_start, nextUp.gmt_offset);
        console.log(chalk.cyan(`\n  Next race: ${nextUp.meeting_name}`));
        console.log(`  ${nextDate} — ${nextUp.location}\n`);
      }
      return;
    }

    const next = nextMeetings[0];
    const nextDate = formatSessionTime(next.date_start, next.gmt_offset);
    console.log(chalk.cyan(`\n  Next Up: ${next.meeting_name}`));
    console.log(`  ${nextDate} — ${next.location}\n`);

    // Show all sessions for the next weekend
    const sessions = await api.getSessions({ meeting_key: next.meeting_key });

    const sessionRows = sessions.map((s) => ({
      name: s.session_name || s.session_type,
      dateTime: formatSessionTime(s.date_start, s.gmt_offset),
      sessionType: s.session_type,
    }));

    console.log(createSessionTable(sessionRows));
    console.log();
    return;
  }

  // We're in a race weekend
  const weekend = weekendMeetings[0];
  const sessions = await api.getSessions({ meeting_key: weekend.meeting_key });

  // Get all upcoming sessions within this weekend (today or future)
  const upcomingSessions = sessions.filter((s) => {
    const end = new Date(s.date_end);
    return end > now && !s.is_cancelled;
  });

  // Check if the weekend is ongoing but all sessions are done
  if (upcomingSessions.length === 0 && sessions.length > 0) {
    console.log(chalk.cyan(`\n  This Weekend: ${weekend.meeting_name} — ${weekend.location}`));
    // Show summary of completed sessions
    const raceSession = sessions.find((s) => s.session_type === 'Race');
    if (raceSession) {
      const raceEnd = new Date(raceSession.date_end);
      if (now > raceEnd) {
        console.log(chalk.green('\n  Race completed!'));
        console.log('  Visit "f1 last" or "f1 results" for full results.\n');
        return;
      }
    }
    console.log(chalk.yellow("\n  All of today's sessions have ended.\n"));
    return;
  }

  console.log(chalk.cyan(`\n  This Weekend: ${weekend.meeting_name} — ${weekend.location}\n`));

  const sessionRows = upcomingSessions.map((s) => {
    const formatted = formatSessionTime(s.date_start, s.gmt_offset);
    const isNow = new Date(s.date_start) <= now && new Date(s.date_end) > now;
    const name = isNow ? chalk.green(`${s.session_name} < LIVE`) : s.session_name;
    return {
      name,
      dateTime: formatted,
      sessionType: s.session_type,
    };
  });

  console.log(createSessionTable(sessionRows));
  console.log();
}
