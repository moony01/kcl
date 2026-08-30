import {
  DEFAULT_LOCALE,
  SITE_URL,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/lib/constants';

export interface OAuthCallbackOptions {
  returnTo?: string | null;
  flow?: 'signup';
}

function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.some((supportedLocale) => supportedLocale === locale);
}

function getSafeLocale(locale: string): SupportedLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

function getOAuthOrigin(): string {
  if (process.env.NODE_ENV === 'production') {
    return SITE_URL;
  }

  return typeof window === 'undefined' ? SITE_URL : window.location.origin;
}

/** Build the locale-aware callback URL used by browser OAuth flows. */
export function getOAuthCallbackUrl(
  locale: string,
  options: OAuthCallbackOptions = {},
): string {
  const callback = new URL(`/${getSafeLocale(locale)}/auth/callback`, getOAuthOrigin());

  if (options.returnTo) {
    callback.searchParams.set('returnTo', options.returnTo);
  }

  if (options.flow) {
    callback.searchParams.set('flow', options.flow);
  }

  return callback.toString();
}
