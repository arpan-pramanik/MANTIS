import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getUserEmail(req: NextRequest) {
  return req.headers.get('x-user-email');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = getUserEmail(req);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure the key belongs to the authenticated user before deleting
    await prisma.apiKey.deleteMany({
      where: {
        id,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
