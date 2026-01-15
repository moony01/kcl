/**
 * Community Posts API
 *
 * GET: 게시글 목록 조회 (페이지네이션)
 * POST: 새 게시글 작성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/hash';
import type {
  PostsResponse,
  CreatePostRequest,
  CreatePostResponse,
  PostListItem,
  Post,
} from '@/types/community';

/** 기본 페이지 크기 */
const DEFAULT_LIMIT = 20;
/** 최대 페이지 크기 */
const MAX_LIMIT = 50;
/** 닉네임 최소/최대 길이 */
const NICKNAME_MIN = 2;
const NICKNAME_MAX = 20;
/** 제목 최소/최대 길이 */
const TITLE_MIN = 2;
const TITLE_MAX = 100;
/** 본문 최소/최대 길이 */
const CONTENT_MIN = 10;
const CONTENT_MAX = 10000;

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
 * GET /api/community/posts
 * 게시글 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)),
    );
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    if (!supabase) {
      // Mock 데이터 반환 (개발 환경)
      console.warn('[Community API] Supabase not available, returning empty list');
      const response: PostsResponse = {
        posts: [],
        totalCount: 0,
        page,
        limit,
        hasMore: false,
      };
      return NextResponse.json(response);
    }

    // 게시글 목록 조회 (최신순)
    const { data: posts, error: postsError } = await supabase
      .from('kcl_posts')
      .select('id, nickname, title, view_count, comment_count, created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('[Community API] Failed to fetch posts:', postsError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch posts' },
        { status: 503 },
      );
    }

    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from('kcl_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false);

    if (countError) {
      console.error('[Community API] Failed to count posts:', countError.message);
    }

    const totalCount = count ?? 0;
    const hasMore = offset + limit < totalCount;

    const response: PostsResponse = {
      posts: (posts as PostListItem[]) || [],
      totalCount,
      page,
      limit,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Community API] Unexpected error in GET /posts:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/community/posts
 * 새 게시글 작성
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreatePostRequest;
    const { nickname, title, content } = body;

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

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      return NextResponse.json(
        { success: false, message: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters` },
        { status: 400 },
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
    }

    if (content.length < CONTENT_MIN || content.length > CONTENT_MAX) {
      return NextResponse.json(
        { success: false, message: `Content must be ${CONTENT_MIN}-${CONTENT_MAX} characters` },
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

    // 게시글 생성
    const { data: newPost, error: insertError } = await supabase
      .from('kcl_posts')
      .insert({
        nickname: nickname.trim(),
        title: title.trim(),
        content: content.trim(),
        ip_hash: ipHash,
      })
      .select('id, nickname, title, content, view_count, comment_count, created_at')
      .single();

    if (insertError) {
      console.error('[Community API] Failed to create post:', insertError.message);
      return NextResponse.json(
        { success: false, message: 'Failed to create post' },
        { status: 500 },
      );
    }

    const response: CreatePostResponse = {
      success: true,
      message: 'Post created successfully',
      post: newPost as Post,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Community API] Unexpected error in POST /posts:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
