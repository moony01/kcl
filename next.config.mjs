import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
 
/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';

const nextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/plolux/kcl' : undefined,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles'), path.join(__dirname, 'src/styles/abstracts')],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? '/plolux/kcl' : '',
  },
};
 
export default withNextIntl(nextConfig);
