import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Replace with your real Paddle Webhook Secret from the Paddle Dashboard
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || 'test_secret';

function verifyPaddleWebhook(req: NextRequest, rawBody: string) {
  // In production, implement Paddle's signature verification
  // https://developer.paddle.com/webhooks/signature-verification
  
  // For sandbox/development without secret, we'll bypass strict validation 
  // but ensure you implement this before going live!
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('paddle-signature');

    if (!verifyPaddleWebhook(req, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;
    const data = payload.data;

    // Paddle events usually include custom_data where we can pass our user's email
    // during the checkout initialization.
    let email = data.custom_data?.email;

    // Fallback: If no custom_data email, find user by subscription ID
    if (!email && data.id) {
      const existingUser = await prisma.user.findFirst({
        where: { paddleSubscriptionId: data.id }
      });
      if (existingUser) {
        email = existingUser.email;
      }
    }

    // Secondary Fallback: Try customer ID
    if (!email && data.customer_id) {
      const existingUser = await prisma.user.findFirst({
        where: { paddleCustomerId: data.customer_id }
      });
      if (existingUser) {
        email = existingUser.email;
      }
    }

    if (!email) {
      console.warn('Webhook received but could not map to any user email:', payload);
      return NextResponse.json({ received: true });
    }

    // Handle Subscription Created or Updated
    if (eventType === 'subscription.created' || eventType === 'subscription.updated' || eventType === 'subscription.activated') {
      await prisma.user.update({
        where: { email },
        data: {
          isSubscribed: data.status === 'active' || data.status === 'trialing',
          paddleCustomerId: data.customer_id,
          paddleSubscriptionId: data.id,
        }
      });
      console.log(`Updated subscription for ${email} to Active`);
    }

    // Handle Subscription Canceled or Past Due
    if (eventType === 'subscription.canceled' || eventType === 'subscription.past_due') {
      await prisma.user.update({
        where: { email },
        data: {
          isSubscribed: false
        }
      });
      console.log(`Updated subscription for ${email} to Canceled/Past Due`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
