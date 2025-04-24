import { Maybe } from '@/monad-like/maybe.monad';

/**
 * Returns a function to call `String.match` on any string and return a `Maybe` instance.
 *
 * @param { string | RegExp } regExp The regular expression to apply.
 * @returns { (str: string) => Maybe<RegExpMatchArray> } A function that tests a string and returns
 * a `MayBe` instance containing an array of matching strings.
 */
export const stringMatch =
  (regExp: string | RegExp) =>
  (str: string): Maybe<RegExpMatchArray> => {
    return new Maybe(str.match(<string | RegExp>regExp));
  };
