import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis if env vars are present, otherwise null
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv()
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, message: 'Missing companyId' }, { status: 400 });
    }

    // Rate Limit Check (Simple IP based)
    // In production, use Upstash Rate Limit SDK
    /*
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `rate_limit:${ip}`;
    // Check key...
    */

    let newScore = 0;

    if (redis) {
      // Increment score by 100
      newScore = await redis.incrby(`company:${companyId}:score`, 100);
      
      // Also update a global total if needed
      // await redis.incrby('global:total_votes', 1);
    } else {
      // Fallback for demo/dev without Redis credentials
      console.log(`[MOCK REDIS] Supported Company ${companyId}, +100 point`);
      newScore = Math.floor(Math.random() * 1000000) + 100; // Fake score
    }

    return NextResponse.json({
      success: true,
      currentScore: newScore,
      message: 'Support successful'
    });

  } catch (error) {
    console.error('Support API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
