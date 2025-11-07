import { NextResponse } from 'next/server';

const terms = [
  { id: '2025-26-T1', name: '2025-26 Term 1' },
  { id: '2025-26-T2', name: '2025-26 Term 2' },
  { id: '2025-26-Summer', name: '2025-26 Summer' },
];

export async function GET() {
  return NextResponse.json({ success: true, count: terms.length, data: terms });
}
