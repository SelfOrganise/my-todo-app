import moment, { Moment } from 'moment';
import timestring from 'timestring';

export function parseTimeString(input?: string) {
  return parseTimeStringHelper(moment(), input);
}

function parseTimeStringHelper(result: Moment, input?: string): Moment | null {
  if (!input) {
    return result;
  }

  // starts with timestring (2d1h)
  const [match, rest] = matchTimeString(input);
  if (match) {
    const minutes = safeTimeString(match);
    result.add(minutes, 'minutes');

    return parseTimeStringHelper(result, rest);
  } else {
    // starts with day of week
    const dayOfWeekMatch = input.match(
      /^(mon?d?a?y?|tue?s?d?a?y?|wed?n?e?s?d?a?y?|thu?r?s?d?a?y?|fri?d?a?y?|sat?u?r?d?a?y?|sun?d?a?y?)(.*)/i
    );
    if (dayOfWeekMatch) {
      const dayOfWeek = dayOfWeekMatch[1];
      const rest = dayOfWeekMatch[2]?.trim();

      result.day(dayOfWeek!);

      if (result.isBefore(moment())) {
        result.add(1, 'week');
      }

      return parseTimeStringHelper(result, rest);
    } else {
      // is a time 9, 21, 9pm
      if (input) {
        const parsedTimeString = safeTimeString(input);
        if (parsedTimeString) {
          result.add(parsedTimeString, 'minutes');
        } else {
          const time = moment(input, ['H:ma']);
          if (time.isValid()) {
            result.hour(time.hour());
            result.minute(time.minute());
          }
        }
      }

      if (result.isBefore(moment())) {
        result.add(1, 'day');
      }

      return result;
    }
  }

  // mon?
  // tue?
  // wed?
  // thu?
  // fri?
  // sat?
  // sun?
  // 1w - +7 days
  // 1mon - +30 days
  //
}

// eg: 2mon2w2d2h1m
function matchTimeString(input: string): [string?, string?] {
  // note: it's not possible in JS to capture repeating groups. We must enumerate each one individually
  // support upto 5 groups (eg: 2mon2w2d2h1m)
  const matchTimeString = input.match(
    /^([0-9]+[wdhm])?([0-9]+[wdhm])?([0-9]+[wdhm])?([0-9]+[wdhm])([0-9]+[wdhm])?(.*)/
  );
  if (!matchTimeString) {
    return [];
  }

  const match = matchTimeString
    .slice(1, -1) // skip first item because it's the input, skip last item because it's the rest of the string
    .filter(s => s)
    .join('');

  const rest = matchTimeString[matchTimeString.length - 1]?.trim();

  return [match, rest];
}

function safeTimeString(input: string): number | null {
  try {
    return timestring(input, 'minutes');
  } catch {
    return null;
  }
}
