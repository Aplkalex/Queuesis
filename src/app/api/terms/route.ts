import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const FALLBACK_TERMS = [
  { id: '2025-26-T2', name: '2025-26 Term 2' },
  { id: '2025-26-Summer', name: '2025-26 Summer' },
];

const hasDatabase = Boolean(process.env.MONGODB_URI);
const allowFallback = process.env.ALLOW_FALLBACK_DATA !== 'false';
const DB_QUERY_TIMEOUT_MS = Number(process.env.DB_QUERY_TIMEOUT_MS ?? 5000);

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export async function GET() {
  if (hasDatabase) {
    try {
      const terms = await withTimeout(
        prisma.term.findMany({
          orderBy: { id: 'asc' },
        }),
        DB_QUERY_TIMEOUT_MS,
        'terms query'
      );

      if (terms.length > 0) {
        const payload = terms
          .map(({ id, name }) => ({ id, name }))
          .filter((term) => term.id !== '2025-26-T1');
        return NextResponse.json({ success: true, count: payload.length, data: payload });
      }
    } catch (error) {
      console.error('[terms] Failed to load terms from MongoDB:', error);
      if (!allowFallback) {
        return NextResponse.json(
          { success: false, error: 'Unable to load terms from database' },
          { status: 500 }
        );
      }
    }
  }

  if (!allowFallback) {
    return NextResponse.json(
      { success: false, error: 'No term data available' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    count: FALLBACK_TERMS.length,
    data: FALLBACK_TERMS,
  });
}
