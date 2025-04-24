import { describe, it, expect } from 'vitest';
import { formatMilliseconds, formatBytesTo } from './number.formatter';

describe('Number formatter.', () => {
  it('should format milliseconds.', () => {
    const formatWithDays = formatMilliseconds('D:H:M:S.s');
    const fourDaysFourHours = 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000;

    const formattedFour = formatWithDays(fourDaysFourHours);
    expect(formattedFour.split(':')[0]).toBe('4');
    expect(formattedFour.split(':')[1]).toBe('04');

    const now = new Date();
    const sinceEpoch = formatWithDays(now.getTime());
    const fullDaysSinceEpoch = Math.floor(now.getTime() / 8.64e7);
    expect(sinceEpoch.split(':')[0]).toBe(String(fullDaysSinceEpoch));

    const formatFrames = formatMilliseconds('H:M:S:f');
    // One hour + 35 minutes + 31 seconds + half of 25 frames per seconds (rounded to 13).
    const oneHourAndHalfMovieDuration =
      60 * 60 * 1000 + 35 * 60 * 1000 + 31 * 1000 + 500;

    // Format at 25 fps.
    const formatted = formatFrames(oneHourAndHalfMovieDuration, 25);
    const split = formatted.split(':');

    expect(parseInt(split[0])).toBe(1);
    expect(parseInt(split[1])).toBe(35);
    expect(parseInt(split[2])).toBe(31);
    expect(parseInt(split[3])).toBe(13);
  });

  it('should format bytes.', () => {
    const toKb = formatBytesTo('kB');
    const toMb = formatBytesTo('Mb');
    const toGb = formatBytesTo('GB');
    const toTb = formatBytesTo('tb');

    expect(parseInt(toKb(1024)!)).toBe(1);
    expect(parseInt(toKb(2048)!)).toBe(2);
    expect(parseInt(toKb(128 * 128)!)).toBe(16);

    expect(parseInt(toMb(1024 * 1024)!)).toBe(1);
    expect(parseInt(toMb(1024 * 2048)!)).toBe(2);
    expect(parseInt(toMb(1024 * 128 * 128)!)).toBe(16);

    expect(parseInt(toGb(1024 * 1024 * 1024)!)).toBe(1);
    expect(parseInt(toGb(1024 * 1024 * 2048)!)).toBe(2);
    expect(parseInt(toGb(1024 * 1024 * 128 * 128)!)).toBe(16);

    expect(parseInt(toTb(1024 * 1024 * 1024 * 1024)!)).toBe(1);
    expect(parseInt(toTb(1024 * 1024 * 1024 * 2048)!)).toBe(2);
  });
});
