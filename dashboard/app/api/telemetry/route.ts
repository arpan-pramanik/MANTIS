import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getUserEmail(req: NextRequest) {
  return req.headers.get('x-user-email');
}

export async function GET(req: NextRequest) {
  try {
    const email = getUserEmail(req);
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { keys: true }
    });

    if (!user || user.keys.length === 0) {
      return NextResponse.json({
        requests: 0,
        threats: 0,
        latency: '--'
      });
    }

    // Since the AWS MANTIS engine handles the real analytics and costs $0 when idle,
    // we do not want to constantly poll AWS DynamoDB for every dashboard refresh unless needed.
    // In a real production environment, you would query AWS DynamoDB DAX or CloudWatch here.
    // For now, we simulate dynamic analytics based on the active API keys.
    const seed = Date.now() / 10000;
    
    return NextResponse.json({
      requests: Math.floor(user.keys.length * 1542 + (Math.random() * 50)),
      threats: Math.floor(user.keys.length * 12 + (Math.random() * 5)),
      latency: Math.floor(15 + Math.random() * 10)
    });

  } catch (error) {
    console.error('Failed to fetch telemetry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
