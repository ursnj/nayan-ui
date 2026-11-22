import { browserStyles } from '@/app/nayan-ui-styles';

export const dynamic = 'force-static';

export function GET() {
  return new Response(browserStyles, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
