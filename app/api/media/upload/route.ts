import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { nanoid } from 'nanoid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/media/upload — Upload an image to R2.
 * Accepts multipart form data with a "file" field.
 * Returns { key, url }.
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const bucket = env.MEDIA;

    if (!bucket) {
      return NextResponse.json(
        { error: 'Media storage not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Supported: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique key
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `cta-images/${nanoid()}.${ext}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    // Return the serve URL (goes through our serve endpoint)
    const url = `/cta-admin/api/media/${key}`;

    return NextResponse.json({ key, url }, { status: 201 });
  } catch (error) {
    console.error('POST /api/media/upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: message },
      { status: 500 }
    );
  }
}
