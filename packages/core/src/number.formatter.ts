import { switchCase } from '@/conditional.utils';

export type BytesConversionDestination =
  | 'kb'
  | 'kB'
  | 'Kb'
  | 'KB'
  | 'mb'
  | 'mB'
  | 'Mb'
  | 'MB'
  | 'gB'
  | 'gb'
  | 'Gb'
  | 'GB'
  | 'tb'
  | 'tB'
  | 'Tb'
  | 'TB';

export const formatMilliseconds = (formatter = 'D:H:M:S.s') => {
  const padToLength = (value: number) =>
    String(value).padStart(String(value).length, '0');
  const padTwo = (value: number) => String(value).padStart(2, '0');
  const padThree = (value: number) => String(value).padStart(3, '0');

  const format = (ms: number, framerate: number) => {
    const frames = () => {
      const seconds = ms / 1000;
      const frames = Math.round((seconds - Math.floor(seconds)) * framerate);
      return padToLength(frames);
    };
    const milliseconds = padThree(Math.floor(ms % 1000));
    const seconds = padTwo(Math.floor((ms / 1000) % 60));
    const minutes = padTwo(Math.floor((ms / (1000 * 60)) % 60));
    const hours = padTwo(Math.floor((ms / (1000 * 60 * 60)) % 24));
    const days = String(Math.floor(ms / (1000 * 60 * 60 * 24)));

    return formatter
      .replaceAll('D', days)
      .replaceAll('H', hours)
      .replaceAll('M', minutes)
      .replaceAll('S', seconds)
      .replaceAll('s', milliseconds)
      .replaceAll('f', frames());
  };

  return (ms: number, framerate = 60) => format(ms, framerate);
};

/**
 * Convert bytes to given number in Kilobytes, Megabytes, etc.
 *
 * @param { BytesConversionDestination } dest The destination size to convert to.
 * @returns { (bytes: number) => string | undefined } A function to convert a num ber of bytes
 * to given size, or `undefined` if given size is not valid.
 */
export const formatBytesTo =
  (dest: BytesConversionDestination) =>
  (bytes: number): string | undefined => {
    const term = 1024;
    const upperDest = dest.toUpperCase();

    const convert = switchCase({
      KB: () => (bytes / term).toFixed(3),
      MB: () => (bytes / term ** 2).toFixed(3),
      GB: () => (bytes / term ** 3).toFixed(3),
      TB: () => (bytes / term ** 4).toFixed(3),
    });

    return convert(upperDest);
  };

export default {
  formatMilliseconds,
  formatBytesTo,
};
