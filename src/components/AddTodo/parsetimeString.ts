import moment, { Moment } from 'moment';
import timestring from 'timestring';

export function parseTimeString(input?: string): [Moment | null, Array<Token>] {
  if (!input) {
    return [null, []];
  }

  return parseTimeStringHelper(moment(), input);
}

export interface Token {
  value: string;
  apply: (result: Moment) => void;
}

class WeekDayToken implements Token {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  apply(result: Moment) {
    result.day(this.value);

    if (result.isBefore(moment())) {
      result.add(1, 'week');
    }
  }
}

class TimeToken implements Token {
  value: string;
  time: Moment;

  constructor(value: string, parsed: Moment) {
    this.value = value;
    this.time = parsed;
  }

  apply(result: Moment) {
    result.hour(this.time.hour());
    result.minute(this.time.minute());

    if (result.isBefore(moment())) {
      result.add(1, 'day');
    }
  }
}

class TimeStringToken implements Token {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  apply(result: Moment) {
    const minutes = safeTimeString(this.value);

    result.add(minutes, 'minutes');
  }
}

interface TokenDefinition {
  type: 'WeekDay' | 'timestring' | 'time';
  match: (input: string) => Token | null;
}

const tokenDefinitions: Array<TokenDefinition> = [
  {
    type: 'WeekDay',
    match: matchWeekDay,
  },
  {
    type: 'time',
    match: matchTime,
  },
  {
    type: 'timestring',
    match: matchTimeString,
  },
];

function parseTimeStringHelper(result: Moment, input?: string): [Moment, Array<Token>] {
  const tokens = getTokens(input);

  for (const token of tokens) {
    token.apply(result);
  }

  return [result, tokens];
}

function getTokens(input?: string): Array<Token> {
  if (!input) {
    return [];
  }

  const tokens = [];
  let currentValue = input; // this gets sliced after every match

  while (currentValue) {
    const match = matchToken(currentValue);
    if (match) {
      currentValue = currentValue.slice(match.value.length).trim();
      tokens.push(match);
    } else {
      return tokens;
    }
  }

  return tokens;
}

function matchToken(input: string): Token | null {
  if (!input) {
    return null;
  }

  for (const tokenDefinition of tokenDefinitions) {
    const match = tokenDefinition.match(input);

    if (match) {
      return match;
    }
  }

  return null;
}

export function matchTime(input: string): TimeToken | null {
  const characters = input.split('');
  const result: Array<string> = [];
  for (let i = 0; i < characters.length; i++) {
    const c = characters[i]!;
    const lastCharacter = result[result.length - 1];

    if (c === ' ') {
      break;
    }

    if (lastCharacter && ['a', 'p'].includes(lastCharacter)) {
      if (c === 'm') {
        result.push(c);
        break;
      } else {
        return null; // expected 'm' but got something else
      }
    }

    if (lastCharacter && Number.isInteger(parseInt(lastCharacter)) && c === ':') {
      result.push(c);
      continue;
    }

    if (
      lastCharacter &&
      (Number.isInteger(parseInt(lastCharacter)) || lastCharacter === ':') &&
      ['a', 'p'].includes(c)
    ) {
      result.push(c);
      continue;
    }

    if (Number.isInteger(parseInt(c))) {
      result.push(c);
      continue;
    }

    return null;
  }

  const timeString = result.join('');
  const parsedTimeString = moment(timeString, ['H:ma']);
  if (parsedTimeString.isValid()) {
    return new TimeToken(timeString, parsedTimeString);
  }

  return null;
}

function matchWeekDay(input: string): WeekDayToken | null {
  const matches = input.match(
    /^(mon?d?a?y?|tue?s?d?a?y?|wed?n?e?s?d?a?y?|thu?r?s?d?a?y?|fri?d?a?y?|sat?u?r?d?a?y?|sun?d?a?y?)/i
  );

  const match = matches?.[1];
  if (match) {
    return new WeekDayToken(match);
  }

  return null;
}

// eg: 2mon2w2d2h1m
function matchTimeString(input: string): TimeStringToken | null {
  // note: it's not possible in JS to capture repeating groups. We must enumerate each one individually
  // support upto 5 groups (eg: 2mon2w2d2h1m)
  const matchTimeString = input.match(/^([0-9]+[wdhm])?([0-9]+[wdhm])?([0-9]+[wdhm])?([0-9]+[wdhm])([0-9]+[wdhm])?/);
  if (!matchTimeString) {
    return null;
  }

  return new TimeStringToken(
    matchTimeString
      .slice(1, -1) // skip first item because it's the input, skip last item because it's the rest of the string
      .filter(s => s)
      .join('')
  );
}

function safeTimeString(input: string): number | null {
  try {
    return timestring(input, 'minutes');
  } catch {
    return null;
  }
}
