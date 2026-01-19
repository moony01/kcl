/**
 * Community Post Detail API
 *
 * GET: 게시글 상세 조회 + 조회수 증가
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { PostDetailResponse, Post, PostComment } from '@/types/community';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * UUID 형식인지 확인
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * GET /api/community/posts/[id]
 * 게시글 상세 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // UUID 형식 검증
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid post ID format' },
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

    // 게시글 조회
    const { data: post, error: postError } = await supabase
      .from('kcl_posts')
      .select('id, nickname, title, content, view_count, comment_count, created_at')
      .eq('id', id)
      .eq('is_hidden', false)
      .single();

    if (postError || !post) {
      console.error('[Community API] Post not found:', postError?.message);
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    // 조회수 증가 (비동기, 실패해도 무시)
    supabase
      .from('kcl_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', id)
      .then((result: { error: { message: string } | null }) => {
        if (result.error) {
          console.warn('[Community API] Failed to increment view count:', result.error.message);
        }
      });

    // 댓글 목록 조회
    const { data: comments, error: commentsError } = await supabase
      .from('kcl_post_comments')
      .select('id, post_id, nickname, content, created_at')
      .eq('post_id', id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.warn('[Community API] Failed to fetch comments:', commentsError.message);
    }

    const response: PostDetailResponse = {
      post: post as Post,
      comments: (comments as PostComment[]) || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Community API] Unexpected error in GET /posts/[id]:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
