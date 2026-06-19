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
import { LeagueHeader } from '@/components/features/league/LeagueHeader';

import AdBanner from '@/components/common/AdBanner';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase/client';
import { AD_SLOTS } from '@/types/ads';
import styles from './page.module.scss';

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
      closeCta: string;
    }
  > = {
    ko: {
      title: '오늘 비로그인 투표권을 모두 사용했어요',
      lead: '로그인하면 매일 더 많은 투표권으로 최애 소속사를 계속 응원할 수 있어요.',
      highlight: '비로그인 100표 / 로그인 300표 (매일)',
      powerVoteTitle: '파워투표',
      powerVote: '투표하기 버튼을 길게 눌러 한 번에 최대 100표까지 투표',
      note: '비로그인 투표권은 UTC 자정에 다시 충전됩니다.',
      primaryCta: '로그인 / 회원가입하기',
      closeCta: '닫기',
    },
    en: {
      title: 'You used all guest votes for today',
      lead: 'Sign in to keep supporting your favorite company with more daily voting power.',
      highlight: 'Guest 100 votes / Member 300 votes daily',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Long-press Vote to cast up to 100 votes at once',
      note: 'Guest votes refresh at midnight UTC.',
      primaryCta: 'Log in / Sign up',
      closeCta: 'Close',
    },
    ja: {
      title: '本日のゲスト投票権を使い切りました',
      lead: 'ログインすると、毎日さらに多くの投票権で推しの事務所を応援できます。',
      highlight: 'ゲスト 100票 / 会員 300票（毎日）',
      powerVoteTitle: 'パワー投票',
      powerVote: '投票ボタン長押しで最大100票までまとめて投票できます',
      note: 'ゲスト投票権はUTC午前0時に再チャージされます。',
      primaryCta: 'ログイン / 会員登録',
      closeCta: '閉じる',
    },
    zh: {
      title: '今天的游客投票权已用完',
      lead: '登录后每天可用更多投票权继续支持你喜爱的公司。',
      highlight: '游客 100票 / 会员 300票（每日）',
      powerVoteTitle: '火力投票',
      powerVote: '长按“投票”按钮，一次最多可投100票',
      note: '游客投票权将在 UTC 午夜刷新。',
      primaryCta: '登录 / 注册',
      closeCta: '关闭',
    },
    es: {
      title: 'Usaste todos tus votos de invitado de hoy',
      lead: 'Inicia sesión para seguir apoyando a tu empresa favorita con más votos diarios.',
      highlight: 'Invitado 100 votos / Miembro 300 votos diarios',
      powerVoteTitle: 'Voto poderoso',
      powerVote: 'Mantén pulsado Votar para emitir hasta 100 votos de una vez',
      note: 'Los votos de invitado se recargan a medianoche UTC.',
      primaryCta: 'Iniciar sesión / Registrarse',
      closeCta: 'Cerrar',
    },
    pt: {
      title: 'Você usou todos os votos de visitante de hoje',
      lead: 'Entre para continuar apoiando sua empresa favorita com mais votos diários.',
      highlight: 'Visitante 100 votos / Membro 300 votos diários',
      powerVoteTitle: 'Voto poderoso',
      powerVote: 'Pressione e segure Votar para lançar até 100 votos de uma vez',
      note: 'Os votos de visitante recarregam à meia-noite UTC.',
      primaryCta: 'Entrar / Cadastrar',
      closeCta: 'Fechar',
    },
    fr: {
      title: 'Vous avez utilisé tous vos votes visiteur du jour',
      lead: 'Connectez-vous pour continuer à soutenir votre entreprise favorite avec plus de votes quotidiens.',
      highlight: 'Visiteur 100 votes / Membre 300 votes par jour',
      powerVoteTitle: 'Vote puissant',
      powerVote: 'Maintenez Voter pour lancer jusqu\'à 100 votes en une fois',
      note: 'Les votes visiteur se rechargent à minuit UTC.',
      primaryCta: 'Connexion / Inscription',
      closeCta: 'Fermer',
    },
    de: {
      title: 'Du hast alle Gast-Stimmen für heute genutzt',
      lead: 'Melde dich an, um dein Lieblingsunternehmen täglich mit mehr Stimmen zu unterstützen.',
      highlight: 'Gast 100 Stimmen / Mitglied 300 Stimmen täglich',
      powerVoteTitle: 'Power-Voting',
      powerVote: 'Halte Abstimmen gedrückt, um bis zu 100 Stimmen auf einmal abzugeben',
      note: 'Gast-Stimmen werden um Mitternacht UTC aufgefüllt.',
      primaryCta: 'Einloggen / Registrieren',
      closeCta: 'Schließen',
    },
    id: {
      title: 'Suara tamu hari ini sudah habis',
      lead: 'Masuk untuk terus mendukung perusahaan favoritmu dengan lebih banyak suara harian.',
      highlight: 'Tamu 100 suara / Anggota 300 suara harian',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Tekan lama tombol Vote untuk memberi hingga 100 suara sekaligus',
      note: 'Suara tamu diisi ulang pada tengah malam UTC.',
      primaryCta: 'Masuk / Daftar',
      closeCta: 'Tutup',
    },
    tr: {
      title: 'Bugünkü misafir oylarının tamamını kullandın',
      lead: 'Favori şirketini daha fazla günlük oyla desteklemeye devam etmek için giriş yap.',
      highlight: 'Misafir 100 oy / Üye 300 oy günlük',
      powerVoteTitle: 'Güçlü Oy',
      powerVote: 'Oy Ver düğmesine basılı tutarak tek seferde en fazla 100 oy kullan',
      note: 'Misafir oyları UTC gece yarısında yenilenir.',
      primaryCta: 'Giriş / Kayıt',
      closeCta: 'Kapat',
    },
    th: {
      title: 'ใช้สิทธิ์โหวตแบบผู้เยี่ยมชมของวันนี้หมดแล้ว',
      lead: 'เข้าสู่ระบบเพื่อสนับสนุนบริษัทที่คุณชื่นชอบต่อด้วยสิทธิ์โหวตรายวันที่มากขึ้น',
      highlight: 'ผู้เยี่ยมชม 100 โหวต / สมาชิก 300 โหวตต่อวัน',
      powerVoteTitle: 'Power Vote',
      powerVote: 'กดปุ่มโหวตค้างไว้ เพื่อโหวตได้สูงสุด 100 โหวตในครั้งเดียว',
      note: 'สิทธิ์โหวตผู้เยี่ยมชมจะรีเซ็ตตอนเที่ยงคืน UTC',
      primaryCta: 'เข้าสู่ระบบ / สมัครสมาชิก',
      closeCta: 'ปิด',
    },
    vi: {
      title: 'Bạn đã dùng hết phiếu khách hôm nay',
      lead: 'Đăng nhập để tiếp tục ủng hộ công ty yêu thích với nhiều phiếu hằng ngày hơn.',
      highlight: 'Khách 100 phiếu / Thành viên 300 phiếu mỗi ngày',
      powerVoteTitle: 'Power Vote',
      powerVote: 'Nhấn giữ nút Bỏ phiếu để bỏ tối đa 100 phiếu cùng lúc',
      note: 'Phiếu khách sẽ được nạp lại vào nửa đêm UTC.',
      primaryCta: 'Đăng nhập / Đăng ký',
      closeCta: 'Đóng',
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

  // T1.102: 투표 컨텍스트(최애 그룹 자동 선택 또는 검색에서 선택된 아티스트)
  const [selectedSubLabelId, setSelectedSubLabelId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);

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

  const handleCloseEventModal = useCallback(() => {
    setIsEventModalOpen(false);
  }, []);

  const handleGuestQuotaExhausted = useCallback(() => {
    if (isAuthLoading || isAuthenticated) return;
    setIsSheetOpen(false);
    setIsEventModalOpen(true);
  }, [isAuthLoading, isAuthenticated]);

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
          setSelectedSubLabelId(null);
          setSelectedArtistName(groupNameEn || null);
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
            setSelectedSubLabelId(companyId);
            setSelectedArtistName(groupNameEn || null);
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

  // 투표 핸들러 - 회사 ID와 선택한 아티스트 컨텍스트를 함께 관리
  const handleVote = useCallback(
    (companyId: string, artistName?: string | null) => {
      // 회사 존재 확인
      const exists = allCompanies.some((c) => c.companyId === companyId);
      if (!exists) return;

      // T1.29: ID만 설정 (실제 데이터는 useMemo에서 파생)
      setSelectedCompanyId(companyId);
      // 수동 회사 선택 시 이전 최애/아티스트 컨텍스트가 남지 않도록 초기화
      setSelectedSubLabelId(null);
      setSelectedArtistName(artistName ?? null);

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
    (companyId: string, artistName?: string) => {
      handleVote(companyId, artistName ?? null);
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
      {/* 시즌 헤더 (h1 + D-day) */}
      <div className={styles.leagueHeaderSection}>
        <LeagueHeader />
      </div>

      {/* 검색창 */}
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
              onGuestQuotaExhausted={handleGuestQuotaExhausted}
              autoSelectedSubLabelId={selectedSubLabelId}
              selectedArtist={selectedArtistName || undefined}
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
          onGuestQuotaExhausted={handleGuestQuotaExhausted}
          autoSelectedSubLabelId={selectedSubLabelId}
          selectedArtist={selectedArtistName || undefined}
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
            <button
              type="button"
              onClick={handleCloseEventModal}
              className={styles.eventDismissBtn}
            >
              {eventModalCopy.closeCta}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default HomeClient;
