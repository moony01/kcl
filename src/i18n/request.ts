import {getRequestConfig} from 'next-intl/server';
 
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
 
  if (!locale || !locales.includes(locale)) {
    locale = 'en';
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
