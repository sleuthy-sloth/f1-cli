import { api } from '../api/client.js';
import {
  formatSessionTime,
  createSessionTable,
  formatCountdown,
  liveIndicator,
  makeBar,
} from '../utils/formatting.js';
import { Spinner } from '../utils/spinner.js';
import chalk from 'chalk';

export async function todayCommand(jsonMode = false): Promise<void> {
  const now = new Date();
  const currentYear = now.getFullYear();

  const meetings = await Spinner.with('Fetching sessions', () =>
    api.getMeetings({ year: currentYear })
  );
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
      const nextUp = activeMeetings.find((m) => new Date(m.date_start) > now);
      if (nextUp) {
        const nextDate = formatSessionTime(nextUp.date_start, nextUp.gmt_offset);
        if (jsonMode) {
          console.log(JSON.stringify({
            status: 'no-weekend',
            nextRace: {
              name: nextUp.meeting_name,
              location: nextUp.location,
              dateStart: nextUp.date_start,
              gmtOffset: nextUp.gmt_offset,
            },
          }, null, 2));
          return;
        }
        console.log(chalk.dim('\n  No F1 action this weekend.'));
        console.log(chalk.cyan(`\n  Next race: ${nextUp.meeting_name}`));
        console.log(`  ${nextDate} -- ${nextUp.location}\n`);
      } else {
        if (jsonMode) {
          console.log(JSON.stringify({ status: 'no-upcoming' }, null, 2));
        }
      }
      return;
    }

    const next = nextMeetings[0];
    const nextDate = formatSessionTime(next.date_start, next.gmt_offset);

    // Show all sessions for the next weekend
    const sessions = await Spinner.with('Fetching sessions', () =>
      api.getSessions({ meeting_key: next.meeting_key })
    );

    const sessionRows = sessions.map((s) => {
      const countdown = formatCountdown(new Date(s.date_start), now);
      const isNow = new Date(s.date_start) <= now && new Date(s.date_end) > now;
      const label = isNow ? `${s.session_name} ${liveIndicator()}` : `${s.session_name} ${chalk.dim(countdown)}`;
      return {
        name: label,
        dateTime: formatSessionTime(s.date_start, s.gmt_offset),
        sessionType: s.session_type,
      };
    });

    if (jsonMode) {
      console.log(JSON.stringify({
        status: 'upcoming',
        meeting: next.meeting_name,
        location: next.location,
        dateStart: next.date_start,
        sessions: sessions.map((s) => ({
          name: s.session_name || s.session_type,
          type: s.session_type,
          dateStart: s.date_start,
          dateEnd: s.date_end,
          gmtOffset: s.gmt_offset,
        })),
      }, null, 2));
      return;
    }

    console.log(chalk.cyan(`\n  Next Up: ${next.meeting_name}`));
    console.log(`  ${nextDate} -- ${next.location}\n`);
    console.log(createSessionTable(sessionRows));
    console.log();
    return;
  }

  // We're in a race weekend
  const weekend = weekendMeetings[0];
  const sessions = await Spinner.with('Fetching sessions', () =>
    api.getSessions({ meeting_key: weekend.meeting_key })
  );

  // Get all upcoming sessions within this weekend (today or future)
  const upcomingSessions = sessions.filter((s) => {
    const end = new Date(s.date_end);
    return end > now && !s.is_cancelled;
  });

  // Check if the weekend is ongoing but all sessions are done
  if (upcomingSessions.length === 0 && sessions.length > 0) {
    if (jsonMode) {
      const raceSession = sessions.find((s) => s.session_type === 'Race');
      const raceCompleted = raceSession ? now > new Date(raceSession.date_end) : false;
      console.log(JSON.stringify({
        status: raceCompleted ? 'completed' : 'ended',
        meeting: weekend.meeting_name,
        location: weekend.location,
      }, null, 2));
      return;
    }
    console.log(chalk.cyan(`\n  This Weekend: ${weekend.meeting_name} -- ${weekend.location}`));
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

  if (jsonMode) {
    console.log(JSON.stringify({
      status: 'live',
      meeting: weekend.meeting_name,
      location: weekend.location,
      sessions: upcomingSessions.map((s) => ({
        name: s.session_name || s.session_type,
        type: s.session_type,
        dateStart: s.date_start,
        dateEnd: s.date_end,
        gmtOffset: s.gmt_offset,
        live: new Date(s.date_start) <= now && new Date(s.date_end) > now,
      })),
    }, null, 2));
    return;
  }

  console.log(chalk.cyan(`\n  This Weekend: ${weekend.meeting_name} -- ${weekend.location}\n`));

  // Check for a live race session to show lap progress
  let lapProgressBar = '';
  const liveRaceSession = upcomingSessions.find(
    (s) => s.session_type === 'Race' && new Date(s.date_start) <= now && new Date(s.date_end) > now
  );
  if (liveRaceSession) {
    try {
      const laps = await api.getLaps({ session_key: liveRaceSession.session_key });
      if (laps.length > 0) {
        // Find the highest lap number across all drivers
        const maxLap = Math.max(...laps.map((l) => l.lap_number));
        // Estimate total laps -- common F1 race distances range 50-78 laps.
        // We cannot get the planned total from the API, so show current lap count.
        const barW = 20;
        const bar = makeBar(maxLap, maxLap + 5, barW); // slight headroom for bar fill
        lapProgressBar = `\n  ${chalk.bold('Lap Progress:')} Lap ${maxLap}  ${bar}\n`;
      }
    } catch {
      // Lap data may not be available yet; silently skip
    }
  }

  const sessionRows = upcomingSessions.map((s) => {
    const formatted = formatSessionTime(s.date_start, s.gmt_offset);
    const isNow = new Date(s.date_start) <= now && new Date(s.date_end) > now;
    if (isNow) {
      const name = `${s.session_name} ${liveIndicator()}`;
      return {
        name,
        dateTime: formatted,
        sessionType: s.session_type,
      };
    }
    const countdown = formatCountdown(new Date(s.date_start), now);
    const name = `${s.session_name} ${chalk.dim(countdown)}`;
    return {
      name,
      dateTime: formatted,
      sessionType: s.session_type,
    };
  });

  if (lapProgressBar) {
    console.log(lapProgressBar);
  }
  console.log(createSessionTable(sessionRows));
  console.log();
}
