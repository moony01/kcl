import '@/styles/main.scss';
import '@/styles/layout/_app-shell.scss';

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
