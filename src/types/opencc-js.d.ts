declare module 'opencc-js' {
  export interface ConverterOptions {
    from: string;
    to: string;
    /** Optional delimiter for segmented conversion */
    delim?: string;
  }

  export type Converter = (text: string) => string;

  export function Converter(options: ConverterOptions): Converter;

  export function CustomConverter(
    dictionary: Record<string, string>,
    order?: string[]
  ): Converter;

  export function HTMLConverter(
    options: ConverterOptions
  ): (html: string) => string;

  export const Locale: Record<string, unknown>;
}
