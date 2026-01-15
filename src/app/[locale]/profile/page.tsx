import ProfileLayout from '@/components/features/profile';

export function generateStaticParams() {
  const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];
  return locales.map((locale) => ({ locale }));
}

export default function ProfilePage() {
  return <ProfileLayout />;
}
