import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'use-intl/core';
import { routing } from './routing';
import enMessages from '../../messages/en.json';
import zhCNMessages from '../../messages/zh-CN.json';

type Messages = typeof enMessages;

let twConverter: ((s: string) => string) | null = null;
let twMessagesCache: Messages | null = null;

/** Deep-convert every string in a message tree from Simplified to Traditional Chinese */
function convertTree(value: unknown, convert: (s: string) => string): unknown {
  if (typeof value === 'string') return convert(value);
  if (Array.isArray(value)) return value.map((v) => convertTree(v, convert));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        convertTree(v, convert),
      ])
    );
  }
  return value;
}

export default getRequestConfig(async ({ locale }) => {
  // Validate locale, fall back to default
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  let messages: Messages;
  if (locale === 'en') {
    messages = enMessages;
  } else if (locale === 'zh-CN') {
    messages = zhCNMessages;
  } else {
    // zh-TW: lazily convert zh-CN messages with OpenCC (runs at build time for SSG)
    if (!twMessagesCache) {
      const { Converter } = await import('opencc-js');
      if (!twConverter) {
        twConverter = Converter({ from: 'cn', to: 'tw' });
      }
      twMessagesCache = convertTree(zhCNMessages, twConverter) as Messages;
    }
    messages = twMessagesCache;
  }

  return {
    // Cast: message tree contains arrays (valid at runtime), older types only model objects/strings
    messages: messages as unknown as AbstractIntlMessages,
  };
});
