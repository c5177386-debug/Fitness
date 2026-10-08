import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation primitives.
 * Use these everywhere instead of next/link and next/navigation
 * so the current locale prefix is preserved.
 */
export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
