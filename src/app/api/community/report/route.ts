/**
 * Community Report API
 *
 * POST: 게시글 또는 댓글 신고
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/hash';
import type { CreateReportRequest, CommunityAPIResponse } from '@/types/community';

/** 신고 사유 최대 길이 */
const REASON_MAX = 200;

/**
 * 클라이언트 IP 추출
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * UUID 형식인지 확인
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * POST /api/community/report
 * 신고 접수
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateReportRequest;
    const { target_type, target_id, reason } = body;

    // 입력 유효성 검증
    if (!target_type || !['post', 'comment'].includes(target_type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid target_type. Must be "post" or "comment"' },
        { status: 400 },
      );
    }

    if (!target_id || typeof target_id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'target_id is required' },
        { status: 400 },
      );
    }

    if (!isValidUUID(target_id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid target_id format' },
        { status: 400 },
      );
    }

    if (reason && (typeof reason !== 'string' || reason.length > REASON_MAX)) {
      return NextResponse.json(
        { success: false, message: `Reason must be at most ${REASON_MAX} characters` },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database not available' },
        { status: 503 },
      );
    }

    // IP 해싱
    const clientIP = getClientIP(req);
    const ipHash = hashIp(clientIP);

    // 중복 신고 확인 (동일 IP에서 동일 대상 신고)
    const { data: existingReport } = await supabase
      .from('kcl_reports')
      .select('id')
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('ip_hash', ipHash)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { success: false, message: 'You have already reported this content' },
        { status: 409 },
      );
    }

    // 대상 존재 여부 확인
    if (target_type === 'post') {
      const { data: post } = await supabase
        .from('kcl_posts')
        .select('id')
        .eq('id', target_id)
        .eq('is_hidden', false)
        .single();

      if (!post) {
        return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
      }
    } else {
      const { data: comment } = await supabase
        .from('kcl_post_comments')
        .select('id')
        .eq('id', target_id)
        .eq('is_hidden', false)
        .single();

      if (!comment) {
        return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });
      }
    }

    // 신고 생성
    const { error: insertError } = await supabase.from('kcl_reports').insert({
      target_type,
      target_id,
      reason: reason?.trim() || null,
      ip_hash: ipHash,
    });

    if (insertError) {
      console.error('[Community API] Failed to create report:', insertError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to submit report' },
        { status: 500 },
      );
    }

    const response: CommunityAPIResponse = {
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Community API] Unexpected error in POST /report:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
