export const runtime = 'edge';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

const ALL_TAGS = ['settings', 'products', 'categories', 'pages'];

export async function POST(request) {
  try {
    const secret = request.nextUrl.searchParams.get('secret');
    const tag = request.nextUrl.searchParams.get('tag');

    const expectedSecret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET || 'fallback_secret';
    if (secret !== expectedSecret) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!tag) {
      return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
    }

    if (tag === 'all') {
      ALL_TAGS.forEach(t => revalidateTag(t));
      return NextResponse.json({ revalidated: true, tags: ALL_TAGS, now: Date.now() });
    }

    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
