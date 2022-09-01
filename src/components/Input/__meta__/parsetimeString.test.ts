import { matchTime } from '../parsetimeString';

describe('matchTime', () => {
  it('should not match empty string', () => {
    const result = matchTime('');
    expect(result).toBeFalsy();
  });

  it.each(['10'])('should match a number string %s', nr => {
    const result = matchTime(nr);
    expect(result?.value).toBe(nr);
  });

  it('should not match when it is a timstring', () => {
    const result = matchTime('1234w');
    expect(result?.value).toBeFalsy();
  });

  test('followed by am/pm', () => {
    const result = matchTime('12am');
    expect(result?.value).toBe('12am');
  });

  test('followed by minute and am/pm', () => {
    const result = matchTime('12:30am');
    expect(result?.value).toBe('12:30am');
  });

  test('followed by :am/pm', () => {
    const result = matchTime('12:');
    expect(result?.value).toBe('12:');
  });

  test('followed by a space and then a timestring', () => {
    const result = matchTime('123 4w');
    expect(result?.value).toBe('123');
  });

  test('followed by a time day of week', () => {
    const result = matchTime('1Monday');
    expect(result?.value).toBe('1');
  });
});
