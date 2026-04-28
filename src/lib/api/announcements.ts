/**
 * KCL 공지사항 Supabase API 레이어
 * 클라이언트 사이드에서 Supabase를 통해 공지사항 데이터 조회
 * 빌드 타임에서는 서버 클라이언트를 통해 정적 페이지 생성용 데이터 조회
 */

import { createClient } from '@/lib/supabase/client';
import type { Announcement, AnnouncementCategory, AnnouncementListItem } from '@/types/announcement';

export const SIGNUP_EVENT_NOTICE_ID = 'event-signup-double-votes-2026-02';

interface EventNoticeCopy {
  title: string;
  content: string;
}

function getEventNoticeCopy(locale = 'ko'): EventNoticeCopy {
  const copies: Record<string, EventNoticeCopy> = {
    ko: {
      title: '회원가입하면 투표권 두배 이벤트 안내',
      content:
        '<p><strong>회원가입하면 매일 투표권이 2배</strong>로 지급됩니다.</p><p>비회원은 일 30표, 회원은 일 60표를 받을 수 있습니다.</p><p>회원 전용 파워투표: 한 번에 최대 50표까지 몰아서 투표할 수 있습니다.</p><p>지금 가입하고 최애 소속사를 더 강하게 응원해보세요.</p>',
    },
    en: {
      title: 'Sign up and get double daily votes',
      content:
        '<p><strong>Sign up to get 2x daily votes.</strong></p><p>Guests get 30 votes per day, while signed-in members get 60 votes per day.</p><p>Members-only Power Vote: cast up to 50 votes at once on your favorite.</p><p>Create your account and support your favorite company with more power.</p>',
    },
    ja: {
      title: '会員登録で投票権2倍イベントのお知らせ',
      content:
        '<p><strong>会員登録すると毎日の投票権が2倍</strong>になります。</p><p>非会員は1日30票、会員は1日60票を受け取れます。</p><p>会員限定パワー投票：一度に最大50票まとめて投票できます。</p><p>今すぐ登録して、推しの事務所をもっと強力に応援しましょう。</p>',
    },
    zh: {
      title: '注册即享双倍投票权活动公告',
      content:
        '<p><strong>注册后每日投票权翻倍。</strong></p><p>游客每天30票，注册会员每天60票。</p><p>会员专属火力投票：一次最多投出50票给你喜爱的公司。</p><p>立即注册，用更强的力量支持你喜爱的公司。</p>',
    },
    es: {
      title: 'Evento: Regístrate y obtén el doble de votos diarios',
      content:
        '<p><strong>Regístrate para obtener el doble de votos diarios.</strong></p><p>Los invitados reciben 30 votos al día, mientras que los miembros registrados reciben 60 votos al día.</p><p>Voto Poderoso exclusivo para miembros: lanza hasta 50 votos a la vez.</p><p>Crea tu cuenta y apoya a tu empresa favorita con más poder.</p>',
    },
    fr: {
      title: 'Événement : Inscrivez-vous et obtenez le double de votes quotidiens',
      content:
        '<p><strong>Inscrivez-vous pour obtenir le double de votes quotidiens.</strong></p><p>Les visiteurs reçoivent 30 votes par jour, tandis que les membres inscrits reçoivent 60 votes par jour.</p><p>Vote Puissant réservé aux membres : lancez jusqu\u2019à 50 votes en une fois.</p><p>Créez votre compte et soutenez votre entreprise favorite avec plus de puissance.</p>',
    },
    de: {
      title: 'Event: Registriere dich und erhalte doppelte tägliche Stimmen',
      content:
        '<p><strong>Registriere dich und erhalte doppelt so viele tägliche Stimmen.</strong></p><p>Gäste erhalten 30 Stimmen pro Tag, registrierte Mitglieder erhalten 60 Stimmen pro Tag.</p><p>Power-Abstimmung nur für Mitglieder: bis zu 50 Stimmen auf einmal abgeben.</p><p>Erstelle dein Konto und unterstütze dein Lieblingsunternehmen mit mehr Stimmkraft.</p>',
    },
  };

  return copies[locale] ?? copies.en;
}

function createSignupEventNotice(locale = 'ko'): Announcement {
  const copy = getEventNoticeCopy(locale);

  return {
    id: SIGNUP_EVENT_NOTICE_ID,
    title: copy.title,
    content: copy.content,
    category: 'event',
    is_pinned: true,
    is_published: true,
    view_count: 0,
    created_at: '2026-02-23T00:00:00.000Z',
    updated_at: '2026-02-23T00:00:00.000Z',
  };
}

/** 공지사항 목록 조회 (공개된 것만, RLS 적용) */
export async function getAnnouncements(
  category?: AnnouncementCategory,
  locale = 'ko',
): Promise<AnnouncementListItem[]> {
  const supabase = createClient();

  let query = supabase
    .from('kcl_announcements')
    .select('id, title, category, is_pinned, is_published, view_count, created_at, updated_at')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[announcements] 목록 조회 실패:', error);
    throw error;
  }

  const notices = data || [];

  if (category && category !== 'event') {
    return notices;
  }

  const eventNotice = createSignupEventNotice(locale);
  const hasSameId = notices.some((notice) => notice.id === eventNotice.id);
  return hasSameId ? notices : [eventNotice, ...notices];
}

/** 공지사항 상세 조회 */
export async function getAnnouncementById(id: string, locale = 'ko'): Promise<Announcement | null> {
  if (id === SIGNUP_EVENT_NOTICE_ID) {
    return createSignupEventNotice(locale);
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_announcements')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('[announcements] 상세 조회 실패:', error);
    return null;
  }

  return data;
}

/** 조회수 증가 */
export async function incrementAnnouncementView(id: string): Promise<void> {
  if (id === SIGNUP_EVENT_NOTICE_ID) {
    return;
  }

  const supabase = createClient();

  await supabase.rpc('increment_kcl_announcement_view', { p_id: id });
}

/**
 * 공개된 공지사항 ID 전체 조회 (빌드 타임 전용)
 * generateStaticParams()에서 사용하여 정적 페이지 생성
 * 서버 환경에서만 호출됨 (createServerClient 사용)
 */
export async function getPublishedAnnouncementIds(): Promise<string[]> {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  if (!supabase) {
    console.warn('[announcements] 서버 클라이언트 생성 실패, 이벤트 공지 ID만 반환');
    return [SIGNUP_EVENT_NOTICE_ID];
  }

  const { data, error } = await supabase
    .from('kcl_announcements')
    .select('id')
    .eq('is_published', true);

  if (error) {
    console.error('[announcements] ID 목록 조회 실패, 이벤트 공지 ID만 반환:', error);
    return [SIGNUP_EVENT_NOTICE_ID];
  }

  const ids = (data || []).map((row: { id: string }) => row.id);
  return ids.includes(SIGNUP_EVENT_NOTICE_ID) ? ids : [SIGNUP_EVENT_NOTICE_ID, ...ids];
}
