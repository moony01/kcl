/**
 * HomeClient (클라이언트 컴포넌트)
 *
 * KCL 리그 시스템 메인 페이지의 클라이언트 사이드 로직
 * SSG 정적 셸에서 렌더링되고, SWR로 클라이언트에서 데이터 로드
 *
 * SSG/CSR 구조:
 * - page.tsx (서버 컴포넌트) → 정적 셸 생성 (빌드 타임)
 * - HomeClient.tsx (클라이언트) → SWR로 데이터 fetching + 인터랙션
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import type { CompanyType } from '@/lib/mock-data';

// 데이터 Hooks
import { useLeagueData } from '@/hooks/useLeagueData';
import type { CompaniesResponse } from '@/types/api';

// UI Components - 지연 로드 (초기 번들 크기 감소)
const BottomSheet = dynamic(() => import('@/components/ui/BottomSheet'), {
  ssr: false, // 모바일 전용, SSR 불필요
});
import StickyPanel from '@/components/ui/StickyPanel';
import SearchBar from '@/components/ui/SearchBar';

// Feature Components - 무거운 컴포넌트 지연 로드
const VoteController = dynamic(() => import('@/components/features/VoteController'), {
  ssr: false,
});
import PremierLeague from '@/components/features/league/PremierLeague';
import LeagueRankingItem from '@/components/features/league/LeagueRankingItem';
const HomeComments = dynamic(() => import('@/components/features/home/HomeComments'), {
  ssr: false,
});

import AdBanner from '@/components/common/AdBanner';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase/client';
import { SIGNUP_EVENT_NOTICE_ID } from '@/lib/api/announcements';
import { AD_SLOTS } from '@/types/ads';
import styles from './page.module.scss';

const EVENT_MODAL_STORAGE_KEY = 'kcl:event-signup-double-votes:hidden-until';

function getEventModalCopy(locale: string) {
  const copies: Record<
    string,
    {
      title: string;
      lead: string;
      highlight: string;
      powerVoteTitle: string;
      powerVote: string;
      note: string;
      primaryCta: string;
      noticeCta: string;
      dismissToday: string;
    }
  > = {
    ko: {
      title: '회원가입하면 투표권 2배',
      lead: '지금 회원가입하면 매일 더 많은 투표권으로 최애 소속사를 응원할 수 있어요.',
      highlight: '비회원 30표 → 회원 60표 (매일)',
      powerVoteTitle: '파워투표',
      powerVote: '투표하기 버튼을 길게 눌러 한 번에 최대 30표까지 투표',
      note: '이벤트 공지에서 상세 내용을 확인해 주세요.',
      primaryCta: '회원가입하고 2배 받기',
      noticeCta: '이벤트 공지 보기',
      dismissToday: '오늘 하루 보지 않기',
    },
    en: {
      title: 'Sign up and get 2x votes',
      lead: 'Create your account now and support your favorite company with more daily voting power.',
      highlight: 'Guest 30 votes → Member 60 votes (daily)',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Long-press Vote to cast up to 30 votes at once',
      note: 'See the event notice for full details.',
      primaryCta: 'Sign up for double votes',
      noticeCta: 'View event notice',
      dismissToday: 'Hide for today',
    },
    ja: {
      title: '会員登録で投票権2倍',
      lead: '今すぐ会員登録して、毎日もっと多くの投票権で推しの事務所を応援しましょう。',
      highlight: '非会員 30票 → 会員 60票（毎日）',
      powerVoteTitle: 'パワー投票',
      powerVote: '投票ボタン長押しで最大30票までまとめて投票できます',
      note: 'イベント告知で詳細をご確認ください。',
      primaryCta: '登録して2倍ゲット',
      noticeCta: 'イベント告知を見る',
      dismissToday: '今日は表示しない',
    },
    zh: {
      title: '注册即享双倍投票权',
      lead: '立即注册账号，每天用更多投票权为你喜爱的公司助力。',
      highlight: '游客 30票 → 会员 60票（每日）',
      powerVoteTitle: '火力投票',
      powerVote: '长按“投票”按钮，一次最多可投30票',
      note: '请查看活动公告了解详情。',
      primaryCta: '注册领取双倍投票',
      noticeCta: '查看活动公告',
      dismissToday: '今天不再显示',
    },
    es: {
      title: 'Regístrate y obtén el doble de votos',
      lead: 'Crea tu cuenta ahora y apoya a tu empresa favorita con el doble de votos diarios.',
      highlight: 'Invitado 30 votos → Miembro 60 votos (diario)',
      powerVoteTitle: 'Voto poderoso',
      powerVote: 'Mantén pulsado Votar para emitir hasta 30 votos de una vez',
      note: 'Consulta el aviso del evento para más detalles.',
      primaryCta: 'Registrarse y obtener el doble',
      noticeCta: 'Ver aviso del evento',
      dismissToday: 'No mostrar hoy',
    },
    pt: {
      title: 'Cadastre-se e ganhe o dobro de votos',
      lead: 'Crie sua conta agora e apoie sua empresa favorita com o dobro de votos diários.',
      highlight: 'Visitante 30 votos → Membro 60 votos (diário)',
      powerVoteTitle: 'Voto poderoso',
      powerVote: 'Pressione e segure Votar para lançar até 30 votos de uma vez',
      note: 'Confira o aviso do evento para mais detalhes.',
      primaryCta: 'Cadastrar e ganhar o dobro',
      noticeCta: 'Ver aviso do evento',
      dismissToday: 'Não mostrar hoje',
    },
    fr: {
      title: 'Inscrivez-vous et obtenez le double de votes',
      lead: 'Créez votre compte maintenant et soutenez votre entreprise favorite avec deux fois plus de votes quotidiens.',
      highlight: 'Visiteur 30 votes → Membre 60 votes (quotidien)',
      powerVoteTitle: 'Vote puissant',
      powerVote: 'Maintenez Voter pour lancer jusqu\'à 30 votes en une fois',
      note: 'Consultez l\'annonce de l\'événement pour plus de détails.',
      primaryCta: 'S\'inscrire pour le double',
      noticeCta: 'Voir l\'annonce de l\'événement',
      dismissToday: 'Ne plus afficher aujourd\'hui',
    },
    de: {
      title: 'Registriere dich und erhalte doppelte Stimmen',
      lead: 'Erstelle jetzt dein Konto und unterstütze dein Lieblingsunternehmen mit doppelt so vielen täglichen Stimmen.',
      highlight: 'Gast 30 Stimmen → Mitglied 60 Stimmen (täglich)',
      powerVoteTitle: 'Power-Voting',
      powerVote: 'Halte Abstimmen gedrückt, um bis zu 30 Stimmen auf einmal abzugeben',
      note: 'Weitere Details findest du in der Event-Ankündigung.',
      primaryCta: 'Registrieren und doppelt erhalten',
      noticeCta: 'Event-Ankündigung ansehen',
      dismissToday: 'Heute nicht mehr anzeigen',
    },
    id: {
      title: 'Daftar dan dapatkan 2x suara',
      lead: 'Buat akun sekarang dan dukung perusahaan favoritmu dengan suara harian dua kali lipat.',
      highlight: 'Tamu 30 suara → Anggota 60 suara (harian)',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Tekan lama tombol Vote untuk memberi hingga 30 suara sekaligus',
      note: 'Lihat pengumuman event untuk detail selengkapnya.',
      primaryCta: 'Daftar untuk suara ganda',
      noticeCta: 'Lihat pengumuman event',
      dismissToday: 'Jangan tampilkan hari ini',
    },
    tr: {
      title: 'Kayıt ol ve 2 kat oy kazan',
      lead: 'Hemen hesap oluştur ve favori şirketini günlük iki kat oyla destekle.',
      highlight: 'Misafir 30 oy → Üye 60 oy (günlük)',
      powerVoteTitle: 'Güçlü Oy',
      powerVote: 'Oy Ver düğmesine basılı tutarak tek seferde en fazla 30 oy kullan',
      note: 'Detaylar için etkinlik duyurusuna göz atın.',
      primaryCta: 'Kayıt ol ve 2 kat kazan',
      noticeCta: 'Etkinlik duyurusunu gör',
      dismissToday: 'Bugün gösterme',
    },
    th: {
      title: 'สมัครสมาชิกรับสิทธิ์โหวต 2 เท่า',
      lead: 'สมัครสมาชิกตอนนี้ แล้วสนับสนุนบริษัทที่คุณชื่นชอบด้วยสิทธิ์โหวตรายวันสองเท่า',
      highlight: 'บุคคลทั่วไป 30 โหวต → สมาชิก 60 โหวต (รายวัน)',
      powerVoteTitle: 'Power Vote',
      powerVote: 'กดปุ่มโหวตค้างไว้ เพื่อโหวตได้สูงสุด 30 โหวตในครั้งเดียว',
      note: 'ดูรายละเอียดเพิ่มเติมได้ที่ประกาศกิจกรรม',
      primaryCta: 'สมัครรับโหวต 2 เท่า',
      noticeCta: 'ดูประกาศกิจกรรม',
      dismissToday: 'ไม่แสดงวันนี้',
    },
    vi: {
      title: 'Đăng ký nhận gấp đôi phiếu bầu',
      lead: 'Tạo tài khoản ngay và ủng hộ công ty yêu thích với lượng phiếu bầu hàng ngày gấp đôi.',
      highlight: 'Khách 30 phiếu → Thành viên 60 phiếu (hàng ngày)',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Nhấn giữ nút Bỏ phiếu để bỏ tối đa 30 phiếu cùng lúc',
      note: 'Xem thông báo sự kiện để biết thêm chi tiết.',
      primaryCta: 'Đăng ký nhận gấp đôi',
      noticeCta: 'Xem thông báo sự kiện',
      dismissToday: 'Không hiển thị hôm nay',
    },
  };
  return copies[locale] ?? copies.en;
}

interface HomeClientProps {
  /** 서버에서 미리 fetch한 초기 데이터 (옵셔널, SSG에서는 사용 안 함) */
  initialData?: CompaniesResponse | null;
}

/**
 * 홈페이지 클라이언트 컴포넌트
 *
 * @param initialData - 서버에서 미리 fetch한 리그 데이터 (옵셔널)
 */
export function HomeClient({ initialData }: HomeClientProps = {}) {
  const locale = useLocale();
  const eventModalCopy = useMemo(() => getEventModalCopy(locale), [locale]);
  const { profile, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // 11위+ 더보기/접기 상태
  const [isExpanded, setIsExpanded] = useState(false);

  // T1.29: 선택된 회사 ID만 상태로 관리 (실제 데이터는 allCompanies에서 파생)
  // 기존 문제: selectedCompany가 투표 시점의 스냅샷을 유지하여 firepower 갱신 안 됨
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // BottomSheet 열림 상태 (모바일)
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const didAutoSelectCompany = useRef(false);

  // T1.102: 최애 그룹 기반 자동 선택 정보 (산하 레이블 + 그룹명)
  const [autoSubLabelId, setAutoSubLabelId] = useState<string | null>(null);
  const [autoArtistName, setAutoArtistName] = useState<string | null>(null);

  // 화면 크기 감지
  const [isMobile, setIsMobile] = useState(true);

  // 회원가입 이벤트 모달
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) {
      return;
    }

    const hiddenUntilRaw = window.localStorage.getItem(EVENT_MODAL_STORAGE_KEY);
    const hiddenUntil = hiddenUntilRaw ? Number(hiddenUntilRaw) : 0;

    if (!Number.isNaN(hiddenUntil) && hiddenUntil > Date.now()) {
      return;
    }

    setIsEventModalOpen(true);
  }, [isAuthLoading, isAuthenticated]);

  const handleCloseEventModal = useCallback(() => {
    setIsEventModalOpen(false);
  }, []);

  const handleDismissEventModalToday = useCallback(() => {
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    window.localStorage.setItem(EVENT_MODAL_STORAGE_KEY, String(nextMidnight.getTime()));
    setIsEventModalOpen(false);
  }, []);

  // 🔥 Supabase에서 직접 데이터 가져오기 (CSR)
  // Phase 5: API Route 대신 Supabase 직접 호출
  const {
    premierLeague,
    allCompanies,
    isLoading,
    error,
    refresh,
  } = useLeagueData({
    refreshInterval: 20000, // SWR 자동 갱신 주기
    fallbackData: initialData ?? undefined, // SSG에서는 undefined
  });

  // 11위 이상 회사들 (더보기/접기 대상)
  const companiesBelow11 = useMemo(() => {
    return allCompanies.slice(10);
  }, [allCompanies]);

  // T1.29: 선택된 회사 데이터를 allCompanies에서 파생 (항상 최신 데이터 반영)
  // 기존: selectedCompany state가 투표 시점 스냅샷 유지 → firepower 갱신 안 됨
  // 수정: selectedCompanyId만 state로 관리, 실제 데이터는 useMemo로 파생
  const selectedCompany = useMemo((): CompanyType | null => {
    if (!selectedCompanyId) return null;

    const companyRanking = allCompanies.find((c) => c.companyId === selectedCompanyId);
    if (!companyRanking) return null;

    // CompanyRanking → CompanyType 변환 (최신 firepower 포함)
    return {
      id: companyRanking.companyId,
      name: {
        en: companyRanking.nameEn,
        ko: companyRanking.nameKo,
      },
      representative: companyRanking.artists,
      firepower: companyRanking.voteCount, // ← 이제 항상 최신 값!
      rank: companyRanking.rank,
      change:
        companyRanking.rankChange > 0 ? 'up' : companyRanking.rankChange < 0 ? 'down' : 'same',
      image: companyRanking.gradientColor.startsWith('linear-gradient')
        ? companyRanking.gradientColor
        : `linear-gradient(135deg, ${companyRanking.gradientColor} 0%, #1A1A1A 100%)`,
      // 로고 이미지 URL (DB에서 가져옴)
      logoUrl: companyRanking.logoUrl || undefined,
      stockHistory: [],
      // T1.75: 산하 레이블 매핑
      subLabels: companyRanking.subLabels?.map((sub) => ({
        id: sub.id,
        nameEn: sub.nameEn,
        nameKo: sub.nameKo,
        artists: sub.artists,
      })),
    };
  }, [selectedCompanyId, allCompanies]);

  useEffect(() => {
    // 이미 자동 선택 완료됨
    if (didAutoSelectCompany.current) {
      return;
    }

    // 사용자가 직접 회사를 선택한 경우 자동 선택 비활성화
    if (selectedCompanyId) {
      didAutoSelectCompany.current = true;
      return;
    }

    // 인증 상태 로딩 중이면 대기
    if (isAuthLoading) {
      return;
    }

    // 로그인했지만 프로필이 아직 로드되지 않은 경우 대기
    // (onAuthStateChange가 isLoading을 먼저 false로 설정하는 레이스 컨디션 방지)
    if (isAuthenticated && !profile) {
      return;
    }

    // 비로그인 또는 최애 그룹 미설정 → 자동 선택 불필요
    if (!profile?.favorite_group_id) {
      didAutoSelectCompany.current = true;
      return;
    }

    // 회사 데이터 로드 대기
    if (allCompanies.length === 0) {
      return;
    }

    const autoSelectCompanyByFavoriteGroup = async () => {
      try {
        const supabase = getSupabase();

        // 1단계: 그룹의 소속사 ID + 그룹명 조회
        const { data: groupData, error: groupError } = await supabase
          .from('kcl_groups')
          .select('company_id, name_en')
          .eq('id', profile.favorite_group_id)
          .single();

        if (groupError || !groupData?.company_id) {
          console.warn('[HomeClient] favorite_group 소속사 조회 실패:', groupError?.message);
          return;
        }

        const companyId = groupData.company_id;
        const groupNameEn = groupData.name_en;

        // 1차: 소속사 자체가 allCompanies에 있는지 확인 (산하 레이블이 아닌 경우)
        const directMatch = allCompanies.some((company) => company.companyId === companyId);
        if (directMatch) {
          setSelectedCompanyId(companyId);
          // 아티스트(그룹)명 설정
          if (groupNameEn) setAutoArtistName(groupNameEn);
          return;
        }

        // 2단계: 산하 레이블인 경우 부모 회사 조회 (예: Source Music → HYBE)
        const { data: companyData } = await supabase
          .from('kcl_companies')
          .select('parent_company_id')
          .eq('id', companyId)
          .single();

        const parentId = companyData?.parent_company_id;
        if (parentId) {
          const parentMatch = allCompanies.some((company) => company.companyId === parentId);
          if (parentMatch) {
            setSelectedCompanyId(parentId);
            // 산하 레이블 ID + 아티스트(그룹)명 설정
            setAutoSubLabelId(companyId);
            if (groupNameEn) setAutoArtistName(groupNameEn);
          }
        }
      } catch (err) {
        console.warn('[HomeClient] favorite_group 자동 선택 중 예외 발생:', err);
      } finally {
        didAutoSelectCompany.current = true;
      }
    };

    autoSelectCompanyByFavoriteGroup();
  }, [profile, isAuthLoading, isAuthenticated, allCompanies, selectedCompanyId]);

  // 투표 핸들러 - 회사 ID만 상태로 설정
  const handleVote = useCallback(
    (companyId: string) => {
      // 회사 존재 확인
      const exists = allCompanies.some((c) => c.companyId === companyId);
      if (!exists) return;

      // T1.29: ID만 설정 (실제 데이터는 useMemo에서 파생)
      setSelectedCompanyId(companyId);

      if (isMobile) {
        setIsSheetOpen(true);
      }
    },
    [allCompanies, isMobile],
  );

  // 투표 성공 핸들러 - 데이터 새로고침
  const handleVoteSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  // 11위+ 더보기/접기 토글 핸들러
  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // 검색 결과 선택 핸들러
  const handleSearchSelect = useCallback(
    (companyId: string) => {
      handleVote(companyId);
    },
    [handleVote],
  );

  // 로딩 상태 (SSG에서는 initialData 없이 시작)
  if (isLoading && allCompanies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading league data...</p>
      </div>
    );
  }

  // 에러 상태
  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load data</p>
        <button type="button" onClick={() => refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* SEO용 H1 태그는 page.tsx에서 sr-only로 렌더링됨 */}

      {/* 검색창 (LeagueHeader는 Header 바에 통합됨) */}
      <div className={styles.searchSection}>
        <SearchBar onSelect={handleSearchSelect} />
      </div>

      {/* 하단 영역: 리그 목록 + Battle Station (2열 레이아웃) */}
      <div className={styles.contentLayout}>
        {/* 좌측: 리그 순위 영역 */}
        <section className={styles.leagueListSection}>
          {/* 1~10위: PremierLeague 컴포넌트 */}
          <PremierLeague
            companies={premierLeague}
            onVote={handleVote}
            selectedCompanyId={selectedCompanyId}
          />

          {/* 11위 이상: 더보기/접기 토글 */}
          {companiesBelow11.length > 0 && (
            <div className={styles.expandSection}>
              {/* 11위+ 아이템 목록 - 펼쳐지는 애니메이션 */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="below11"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className={styles.expandedList}
                    style={{ overflow: 'hidden' }}
                  >
                    {companiesBelow11.map((company) => (
                      <LeagueRankingItem
                        key={company.companyId}
                        company={company}
                        onVote={handleVote}
                        displayRank={company.rank}
                        isSelected={selectedCompanyId === company.companyId}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 더보기/접기 버튼 - 항상 목록 아래에 위치 */}
              <button
                type="button"
                className={styles.expandToggleBtn}
                onClick={handleToggleExpand}
                aria-expanded={isExpanded}
              >
                <span>{isExpanded ? 'Collapse' : 'Show more'}</span>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </button>
            </div>
          )}
        </section>

        {/* 우측: Battle Station 패널 (데스크톱 전용) */}
        <aside className={styles.panelColumn}>
          <StickyPanel isVisible={true} title="Battle Station">
            <VoteController
              company={selectedCompany}
              onVoteSuccess={handleVoteSuccess}
              autoSelectedSubLabelId={autoSubLabelId}
              selectedArtist={autoArtistName || undefined}
            />
          </StickyPanel>
        </aside>
      </div>

      {/* 홈 광고 - 랭킹과 팬토크 사이 */}
      <AdBanner adSlot={AD_SLOTS.HOME_BOTTOM} adFormat="leaderboard" />

      {/* 팬 토크 (댓글 섹션) */}
      <section className={styles.commentsSection}>
        <HomeComments />
      </section>

      {/* 모바일 투표 BottomSheet */}
      <BottomSheet
        isOpen={isSheetOpen && isMobile}
        onClose={() => setIsSheetOpen(false)}
        heightRatio={0.55}
      >
        <VoteController
          company={selectedCompany}
          onVoteSuccess={handleVoteSuccess}
          autoSelectedSubLabelId={autoSubLabelId}
          selectedArtist={autoArtistName || undefined}
        />
      </BottomSheet>

      <Modal
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        title={eventModalCopy.title}
      >
        <div className={styles.eventModalContent}>
          <span className={styles.eventModalEmoji} aria-hidden="true">🎉</span>
          <p className={styles.eventModalLead}>{eventModalCopy.lead}</p>
          <div className={styles.eventModalBenefitCard}>
            <ul className={styles.eventBenefitList}>
              <li className={styles.eventBenefitItem}>
                <p className={styles.eventModalHighlight}>{eventModalCopy.highlight}</p>
              </li>
              <li className={styles.eventBenefitItem}>
                <p className={styles.eventBenefitTitle}>{eventModalCopy.powerVoteTitle}</p>
                <p className={styles.eventModalPowerVote}>{eventModalCopy.powerVote}</p>
              </li>
            </ul>
          </div>
          <p className={styles.eventModalNote}>{eventModalCopy.note}</p>
          <div className={styles.eventModalActions}>
            <Link href={`/${locale}/signup`} className={styles.eventPrimaryBtn}>
              {eventModalCopy.primaryCta}
            </Link>
            <Link
              href={`/${locale}/notice/${SIGNUP_EVENT_NOTICE_ID}`}
              className={styles.eventSecondaryBtn}
            >
              {eventModalCopy.noticeCta}
            </Link>
            <button
              type="button"
              onClick={handleDismissEventModalToday}
              className={styles.eventDismissBtn}
            >
              {eventModalCopy.dismissToday}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default HomeClient;
