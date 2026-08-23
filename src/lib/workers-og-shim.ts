interface WorkersImageResponseInit extends ResponseInit {
  width?: number;
  height?: number;
  fonts?: unknown[];
}

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0B0D12"/><text x="600" y="315" fill="#F5F7FA" font-family="Arial, sans-serif" font-size="72" font-weight="700" text-anchor="middle">MEARROW</text></svg>`;

/**
 * Workers-only fallback for metadata routes.
 *
 * The Pages build keeps the real next/og implementation. This lightweight
 * response prevents resvg/wasm from entering the Free-plan Worker bundle.
 */
export class ImageResponse extends Response {
  constructor(_body: unknown, init: WorkersImageResponseInit = {}) {
    const headers = new Headers(init.headers);
    headers.set('content-type', 'image/svg+xml');
    super(PLACEHOLDER_SVG, {
      ...init,
      headers,
    });
  }
}
