/**
 * A codec that can encode and decode values of type V to and from strings.
 * @typeParam V The type of values that can be encoded and decoded.
 */
export interface Codec<V> {
  /**
   * Decodes a string value into a value of type V.
   * @param value The value to decode.
   * @returns The decoded value.
   */
  parse: (value: string) => V;
  /**
   * Encodes a value of type V into a string.
   * @param value The value to encode.
   * @returns The encoded value.
   */
  stringify: (value: V) => string;
}

/**
 * A codec that can encode and decode Date objects to and from strings.
 */
export const CODEC_DATE: Codec<Date> = {
  parse: (value) => new Date(value),
  stringify: (value) => value.toISOString(),
};

/**
 * A codec that can encode and decode Date objects to and from strings, but only the date part.
 */
export const CODEC_DATE_ONLY: Codec<Date> = {
  parse: (value) => new Date(value),
  stringify: (value) => value.toISOString().split('T')[0],
};

/**
 * A codec that can encode and decode numbers to and from strings.
 */
export const CODEC_NUMBER: Codec<number> = {
  parse: (value) => Number(value),
  stringify: (value) => String(value),
};

/**
 * A codec that can encode and decode boolean values to and from strings.
 */
export const CODE_BOOLEAN: Codec<boolean> = {
  parse: (value) => value === 'true',
  stringify: (value) => String(value),
};

/**
 * A codec that can encode and decode JSON values to and from strings.
 */
export const CODEC_JSON: Codec<unknown> = {
  parse: (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
  stringify: (value) => JSON.stringify(value),
};

/**
 * A codec that can encode and decode JSON values to and from strings.
 * If the JSON value is invalid, parsing will fail.
 */
export const CODEC_JSON_STRICT: Codec<unknown> = {
  parse: (value) => JSON.parse(value),
  stringify: (value) => JSON.stringify(value),
};

/**
 * A codec that can encode and decode strings to and from strings.
 */
export const CODEC_STRING: Codec<string> = {
  parse: (value) => value,
  stringify: (value) => value,
};
