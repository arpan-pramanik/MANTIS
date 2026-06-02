import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Basic session validation using an authorization header or custom mechanism.
// Since the frontend relies on localStorage and the user's Google email for demo auth,
// we will accept the user email via a header for the sake of this prototype.
// In a true production app, use NextAuth or JWTs for server-side validation.
function getUserEmail(req: NextRequest) {
  return req.headers.get('x-user-email');
}

export async function GET(req: NextRequest) {
  try {
    const email = getUserEmail(req);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert user to ensure they exist in DB
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        partialKey: true,
        name: true,
        createdAt: true,
        lastUsed: true,
      }
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Failed to fetch keys:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = getUserEmail(req);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Generate a secure API Key
    const rawSecret = crypto.randomBytes(24).toString('base64url');
    const rawKey = `mantis_sk_${rawSecret}`;
    
    // Hash the key before storing it (SHA-256)
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    // Generate a partial key for display
    const partialKey = `mantis_sk_...${rawKey.slice(-4)}`;

    const newKey = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        partialKey,
        userId: user.id,
        name: 'MANTIS API Key'
      }
    });

    // We only return the raw key ONCE upon creation
    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      partialKey: newKey.partialKey,
      createdAt: newKey.createdAt,
      rawKey // NEVER RETURNED AGAIN
    });
  } catch (error) {
    console.error('Failed to generate key:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
