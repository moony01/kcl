/**
 * Community Post Comments API
 *
 * POST: 댓글 작성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/hash';
import type { CreateCommentRequest, CreateCommentResponse, PostComment } from '@/types/community';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** 닉네임 최소/최대 길이 */
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
/** 댓글 최소/최대 길이 */
const CONTENT_MIN = 1;
const CONTENT_MAX = 500;

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
 * POST /api/community/posts/[id]/comments
 * 댓글 작성
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;

    // UUID 형식 검증
    if (!isValidUUID(postId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid post ID format' },
        { status: 400 },
      );
    }

    const body = (await req.json()) as CreateCommentRequest;
    const { nickname, content } = body;

    // 입력 유효성 검증
    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Nickname is required' },
        { status: 400 },
      );
    }

    if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
      return NextResponse.json(
        { success: false, message: `Nickname must be ${NICKNAME_MIN}-${NICKNAME_MAX} characters` },
        { status: 400 },
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Comment content is required' },
        { status: 400 },
      );
    }

    if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
      return NextResponse.json(
        { success: false, message: `Comment must be ${CONTENT_MIN}-${CONTENT_MAX} characters` },
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

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('kcl_posts')
      .select('id')
      .eq('id', postId)
      .eq('is_hidden', false)
      .single();

    if (postError || !post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    // IP 해싱
    const clientIP = getClientIP(req);
    const ipHash = hashIp(clientIP);

    // 댓글 생성
    const { data: newComment, error: insertError } = await supabase
      .from('kcl_post_comments')
      .insert({
        post_id: postId,
        nickname: nickname.trim(),
        content: content.trim(),
        ip_hash: ipHash,
      })
      .select('id, post_id, nickname, content, created_at')
      .single();

    if (insertError) {
      console.error('[Community API] Failed to create comment:', insertError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to create comment' },
        { status: 500 },
      );
    }

    const response: CreateCommentResponse = {
      success: true,
      message: 'Comment created successfully',
      comment: newComment as PostComment,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Community API] Unexpected error in POST /posts/[id]/comments:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
