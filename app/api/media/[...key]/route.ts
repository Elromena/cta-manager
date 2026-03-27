import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * GET /api/media/[...key] — Serve an image from R2.
 * Since Webflow Cloud R2 doesn't support public buckets,
 * this endpoint streams the image with proper headers.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { env } = getCloudflareContext();
    const bucket = env.R2;

    if (!bucket) {
      return new Response('Media storage not configured', { status: 500 });
    }

    const { key } = await params;
    const objectKey = key.join('/');

    const object = await bucket.get(objectKey);
    if (!object) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('GET /api/media/[...key] error:', error);
    return new Response('Failed to serve image', { status: 500 });
  }
}
