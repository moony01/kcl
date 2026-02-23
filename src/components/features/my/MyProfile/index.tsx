'use client';

/**
 * MyProfile - 마이페이지 프로필 컴포넌트
 *
 * 인증된 사용자의 실제 프로필 데이터를 표시합니다.
 * kcl_user_profiles 테이블의 데이터와 연동됩니다.
 *
 * 구성:
 * 1. 프로필 헤더: 아바타, 유저네임, 이메일
 * 2. 통계: 총 투표수, 가입일
 * 3. 투표 현황: 월간 투표 사용량, 상위 소속사 (T1.85)
 * 4. 계정 관리: 로그아웃 버튼
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Flame, Calendar, User, Mail, Trophy, TrendingUp, Crown, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';
import { getUserVoteStats, type UserVoteStats } from '@/lib/api';
import { getSupabase } from '@/lib/supabase/client';
import styles from './MyProfile.module.scss';

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 20;
const SEARCH_MIN_LENGTH = 2;
const DROPDOWN_MAX_RESULTS = 6;

interface GroupRow {
  id: string;
  name_ko: string | null;
  name_en: string | null;
  company_id: string;
  slug: string;
  group_type: string | null;
  kcl_companies:
    | { name_ko: string | null; name_en: string | null }
    | { name_ko: string | null; name_en: string | null }[]
    | null;
}

export default function MyProfile() {
  const t = useTranslations('Auth');
  const tOnboarding = useTranslations('Onboarding');
  const { user, profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  /** 투표 통계 상태 */
  const [voteStats, setVoteStats] = useState<UserVoteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [favoriteGroupName, setFavoriteGroupName] = useState<string | null>(null);
  const [favoriteGroupLoading, setFavoriteGroupLoading] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [highlightedGroupIndex, setHighlightedGroupIndex] = useState(-1);
  const [groupsFetching, setGroupsFetching] = useState(false);

  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const groupSearchRef = useRef<HTMLDivElement>(null);

  /** 서버에서 투표 통계 가져오기 */
  useEffect(() => {
    if (!user?.id) {
      setStatsLoading(false);
      return;
    }

    getUserVoteStats(user.id)
      .then((stats) => {
        setVoteStats(stats);
      })
      .catch((err) => {
        console.error('[MyProfile] Failed to fetch vote stats:', err);
      })
      .finally(() => {
        setStatsLoading(false);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!profile?.favorite_group_id) {
      setFavoriteGroupName(null);
      setFavoriteGroupLoading(false);
      return;
    }

    const fetchFavoriteGroup = async () => {
      setFavoriteGroupLoading(true);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('kcl_groups')
          .select('name_ko, name_en')
          .eq('id', profile.favorite_group_id)
          .single();

        if (error) {
          console.warn('[MyProfile] 최애 그룹 조회 실패:', error.message);
          setFavoriteGroupName(null);
          return;
        }

        const name = locale === 'ko'
          ? data?.name_ko || data?.name_en || null
          : data?.name_en || data?.name_ko || null;

        setFavoriteGroupName(name);
      } catch (err) {
        console.warn('[MyProfile] 최애 그룹 조회 중 예외 발생:', err);
        setFavoriteGroupName(null);
      } finally {
        setFavoriteGroupLoading(false);
      }
    };

    fetchFavoriteGroup();
  }, [profile?.favorite_group_id, locale]);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setGroupsFetching(false);
      return;
    }

    const fetchGroups = async () => {
      setGroupsFetching(true);
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('kcl_groups')
          .select(
            'id, name_ko, name_en, company_id, slug, group_type, kcl_companies(name_ko, name_en)',
          )
          .eq('is_active', true)
          .order('name_en');

        if (error) {
          console.warn('[MyProfile] 그룹 목록 조회 실패:', error.message);
          setGroups([]);
          return;
        }

        setGroups((data ?? []) as GroupRow[]);
      } catch (err) {
        console.warn('[MyProfile] 그룹 목록 조회 중 예외 발생:', err);
        setGroups([]);
      } finally {
        setGroupsFetching(false);
      }
    };

    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (!showGroupDropdown) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupSearchRef.current &&
        !groupSearchRef.current.contains(event.target as Node)
      ) {
        setShowGroupDropdown(false);
        setHighlightedGroupIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupDropdown]);

  useEffect(() => {
    if (isEditingNickname) {
      nicknameInputRef.current?.focus();
      nicknameInputRef.current?.select();
    }
  }, [isEditingNickname]);

  const toDisplayGroupName = useCallback(
    (group: GroupRow) => {
      return locale === 'ko'
        ? group.name_ko || group.name_en || '-'
        : group.name_en || group.name_ko || '-';
    },
    [locale],
  );

  const getGroupCompanyName = useCallback(
    (group: GroupRow) => {
      const company = Array.isArray(group.kcl_companies)
        ? group.kcl_companies[0] || null
        : group.kcl_companies;

      return locale === 'ko'
        ? company?.name_ko || company?.name_en || '-'
        : company?.name_en || company?.name_ko || '-';
    },
    [locale],
  );

  const filteredGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLowerCase();
    if (keyword.length < SEARCH_MIN_LENGTH) {
      return [];
    }

    return groups
      .filter((group) => {
        const nameKo = (group.name_ko || '').toLowerCase();
        const nameEn = (group.name_en || '').toLowerCase();
        return nameKo.includes(keyword) || nameEn.includes(keyword);
      })
      .slice(0, DROPDOWN_MAX_RESULTS);
  }, [groupSearch, groups]);

  const handleStartNicknameEdit = () => {
    setEditNickname(profile?.username || '');
    setNicknameError('');
    setIsEditingNickname(true);
  };

  const handleCancelNicknameEdit = () => {
    setEditNickname(profile?.username || '');
    setNicknameError('');
    setIsEditingNickname(false);
  };

  const handleSaveNickname = async () => {
    if (!user || nicknameSaving) {
      return;
    }

    const trimmed = editNickname.trim();
    if (trimmed.length < NICKNAME_MIN_LENGTH || trimmed.length > NICKNAME_MAX_LENGTH) {
      setNicknameError(
        locale === 'ko'
          ? '닉네임은 2자 이상 20자 이하로 입력해주세요.'
          : 'Nickname must be between 2 and 20 characters.',
      );
      return;
    }

    setNicknameSaving(true);
    setNicknameError('');

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('kcl_user_profiles')
        .update({ username: trimmed })
        .eq('id', user.id);

      if (error) {
        setNicknameError(
          locale === 'ko'
            ? '닉네임 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
            : 'Failed to save nickname. Please try again.',
        );
        return;
      }

      await refreshProfile();
      setIsEditingNickname(false);
    } catch (err) {
      console.warn('[MyProfile] 닉네임 저장 중 예외 발생:', err);
      setNicknameError(
        locale === 'ko'
          ? '닉네임 저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
          : 'Failed to save nickname. Please try again.',
      );
    } finally {
      setNicknameSaving(false);
    }
  };

  const handleGroupSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGroupSearch(value);
    setHighlightedGroupIndex(-1);
    setShowGroupDropdown(value.trim().length >= SEARCH_MIN_LENGTH);
  };

  const handleOpenGroupSearch = () => {
    setShowGroupDropdown(true);
    setHighlightedGroupIndex(-1);
  };

  const handleGroupSearchFocus = () => {
    if (groupSearch.trim().length >= SEARCH_MIN_LENGTH) {
      setShowGroupDropdown(true);
    }
  };

  const handleSelectGroup = async (group: GroupRow) => {
    if (!user) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('kcl_user_profiles')
        .update({ favorite_group_id: group.id })
        .eq('id', user.id);

      if (error) {
        console.warn('[MyProfile] 최애 그룹 저장 실패:', error.message);
        return;
      }

      setFavoriteGroupName(toDisplayGroupName(group));
      setGroupSearch('');
      setShowGroupDropdown(false);
      setHighlightedGroupIndex(-1);
      await refreshProfile();
    } catch (err) {
      console.warn('[MyProfile] 최애 그룹 저장 중 예외 발생:', err);
    }
  };

  const handleRemoveFavoriteGroup = async () => {
    if (!user) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('kcl_user_profiles')
        .update({ favorite_group_id: null })
        .eq('id', user.id);

      if (error) {
        console.warn('[MyProfile] 최애 그룹 해제 실패:', error.message);
        return;
      }

      setFavoriteGroupName(null);
      setGroupSearch('');
      setShowGroupDropdown(false);
      setHighlightedGroupIndex(-1);
      await refreshProfile();
    } catch (err) {
      console.warn('[MyProfile] 최애 그룹 해제 중 예외 발생:', err);
    }
  };

  const handleGroupSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showGroupDropdown || filteredGroups.length === 0) {
      if (event.key === 'Escape') {
        setShowGroupDropdown(false);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedGroupIndex((prev) =>
          prev < filteredGroups.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedGroupIndex((prev) =>
          prev > 0 ? prev - 1 : filteredGroups.length - 1,
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedGroupIndex >= 0 && highlightedGroupIndex < filteredGroups.length) {
          void handleSelectGroup(filteredGroups[highlightedGroupIndex]);
        }
        break;
      case 'Escape':
        setShowGroupDropdown(false);
        setHighlightedGroupIndex(-1);
        break;
    }
  };

  /** 로그아웃 후 홈으로 이동 */
  const handleSignOut = async () => {
    await signOut();
    router.replace(`/${locale}`);
  };

  /** 아바타 이니셜 (유저네임 첫 글자) */
  const initial = (profile?.username || user?.email || '?').charAt(0).toUpperCase();

  /** 가입일 포맷 */
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  /** OAuth 프로바이더 표시 */
  const provider = user?.app_metadata?.provider;
  const providerLabel = provider === 'google' ? 'Google' : provider === 'kakao' ? 'Kakao' : 'Email';

  /** 일일 투표 사용률 (%) */
  const dailyUsagePercent = voteStats
    ? Math.round((voteStats.dailyUsed / voteStats.dailyLimit) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* 프로필 헤더 */}
      <motion.header
        className={styles.profileHeader}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitial}>{initial}</span>
          </div>
        </div>

        <div className={styles.userInfo}>
          {!isEditingNickname ? (
            <div className={styles.usernameRow}>
              <h1 className={styles.username}>{profile?.username || 'User'}</h1>
              <button
                type="button"
                className={`${styles.editNicknameBtn} ${styles.editNicknameBtnFloating}`}
                onClick={handleStartNicknameEdit}
                aria-label={locale === 'ko' ? '닉네임 편집' : 'Edit nickname'}
              >
                <Pencil size={14} />
              </button>
            </div>
          ) : (
            <div className={styles.editNicknameWrap}>
              <input
                ref={nicknameInputRef}
                type="text"
                value={editNickname}
                onChange={(event) => setEditNickname(event.target.value)}
                className={styles.editNicknameInput}
                maxLength={NICKNAME_MAX_LENGTH}
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.editNicknameBtn}
                onClick={handleSaveNickname}
                disabled={nicknameSaving}
                aria-label={locale === 'ko' ? '닉네임 저장' : 'Save nickname'}
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                className={styles.editNicknameBtn}
                onClick={handleCancelNicknameEdit}
                disabled={nicknameSaving}
                aria-label={locale === 'ko' ? '닉네임 취소' : 'Cancel nickname edit'}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {nicknameError && <p className={styles.editNicknameError}>{nicknameError}</p>}
          <p className={styles.email}>
            <Mail size={14} />
            {user?.email || '-'}
          </p>
          <div className={styles.providerBadge}>
            {providerLabel}
          </div>
        </div>
      </motion.header>

      {/* 통계 섹션 */}
      <motion.section
        className={styles.statsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className={styles.statCard}>
          <Flame className={styles.statIcon} />
          <span className={styles.statValue}>
            {(voteStats?.totalVotes || profile?.total_votes || 0).toLocaleString()}
          </span>
          <span className={styles.statLabel}>Total Votes</span>
        </div>

        <div className={styles.statCard}>
          <Calendar className={styles.statIcon} />
          <span className={styles.statValue}>{joinDate}</span>
          <span className={styles.statLabel}>Joined</span>
        </div>
      </motion.section>

      {/* T1.85: 월간 투표 현황 섹션 */}
      <motion.section
        className={styles.voteStatsSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <h3 className={styles.sectionTitle}>
          <TrendingUp size={18} />
          {locale === 'ko' ? '오늘의 투표' : "Today's Votes"}
        </h3>

        {statsLoading ? (
          <div className={styles.statsLoading}>Loading...</div>
        ) : voteStats ? (
          <>
            {/* 일일 사용량 프로그레스 */}
            <div className={styles.monthlyProgress}>
              <div className={styles.monthlyHeader}>
                <span className={styles.monthlyUsed}>
                  {voteStats.dailyUsed}
                  <span className={styles.monthlyMax}>/{voteStats.dailyLimit}</span>
                </span>
                <span className={styles.monthlyPercent}>{dailyUsagePercent}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${dailyUsagePercent}%` }}
                />
              </div>
              <p className={styles.monthlyHint}>
                {locale === 'ko'
                  ? `남은 투표: ${voteStats.dailyRemaining}표`
                  : `Remaining: ${voteStats.dailyRemaining} votes`}
              </p>
            </div>

            {/* 상위 투표 소속사 */}
            {voteStats.topCompanies.length > 0 && (
              <div className={styles.topCompanies}>
                <h4 className={styles.topTitle}>
                  <Trophy size={16} />
                  {locale === 'ko' ? '나의 Top 소속사' : 'My Top Labels'}
                </h4>
                <div className={styles.topList}>
                  {voteStats.topCompanies.map((company, index) => (
                    <div key={company.company_id || index} className={styles.topItem}>
                      <span className={styles.topRank}>#{index + 1}</span>
                      <span className={styles.topName}>{company.company_name}</span>
                      <span className={styles.topCount}>
                        {(company.vote_count ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className={styles.noStats}>
            {locale === 'ko' ? '아직 투표 기록이 없습니다' : 'No votes yet'}
          </p>
        )}
      </motion.section>

      {/* T2.02: KCL Pro 구독 섹션 */}
      {FEATURES.PRO_SUBSCRIPTION && (
        <motion.section
          className={styles.proSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          <h3 className={styles.sectionTitle}>
            <Crown size={18} />
            KCL Pro
          </h3>
          {profile?.is_pro ? (
            <div className={styles.proActiveCard}>
              <div className={styles.proBadgeRow}>
                <span className={styles.proActiveBadge}>PRO</span>
                <span className={styles.proActiveText}>
                  {locale === 'ko' ? '활성 구독 중' : 'Active Subscription'}
                </span>
              </div>
              <p className={styles.proVoteInfo}>
                {locale === 'ko' ? '일 300표 투표 가능' : '300 votes per day'}
              </p>
              <Link href={`/${locale}/pro`} className={styles.proManageLink}>
                {locale === 'ko' ? '구독 관리' : 'Manage Subscription'}
              </Link>
            </div>
          ) : (
            <Link href={`/${locale}/pro`} className={styles.proUpgradeCard}>
              <div className={styles.proUpgradeLeft}>
                <Crown size={20} className={styles.proUpgradeIcon} />
                <div>
                  <span className={styles.proUpgradeTitle}>
                    {locale === 'ko' ? 'Pro로 업그레이드' : 'Upgrade to Pro'}
                  </span>
                  <span className={styles.proUpgradeDesc}>
                    {locale === 'ko' ? '일 300표 · $1.99/월' : '300 votes/day · $1.99/mo'}
                  </span>
                </div>
              </div>
              <span className={styles.proUpgradeArrow}>→</span>
            </Link>
          )}
        </motion.section>
      )}

      <motion.section
        className={styles.favoriteGroupSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.19 }}
      >
        <h3 className={styles.sectionTitle}>{tOnboarding('my_favorite_group')}</h3>
        <div className={styles.favoriteGroupCard}>
          {favoriteGroupName ? (
            <>
              <div>
                <p className={styles.favoriteGroupName}>
                  {favoriteGroupLoading ? '...' : favoriteGroupName}
                </p>
              </div>
              <div className={styles.favoriteGroupActions}>
                <button
                  type="button"
                  className={styles.favoriteGroupAction}
                  onClick={handleOpenGroupSearch}
                >
                  {locale === 'ko' ? '변경' : 'Change'}
                </button>
                <button
                  type="button"
                  className={`${styles.favoriteGroupAction} ${styles.favoriteGroupRemoveAction}`}
                  onClick={handleRemoveFavoriteGroup}
                >
                  {locale === 'ko' ? '해제' : 'Remove'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.groupSearchSection}>
              <p className={styles.favoriteGroupName}>
                {locale === 'ko' ? '최애 그룹을 설정하세요' : 'Set your favorite group'}
              </p>
            </div>
          )}
        </div>

        {(!favoriteGroupName || showGroupDropdown) && (
          <div className={styles.groupSearchSection}>
            {favoriteGroupName && (
              <div className={styles.groupChip}>
                <span>{favoriteGroupName}</span>
                <button
                  type="button"
                  className={styles.groupChipRemove}
                  onClick={handleRemoveFavoriteGroup}
                  aria-label={locale === 'ko' ? '최애 그룹 해제' : 'Remove favorite group'}
                >
                  ✕
                </button>
              </div>
            )}

            <div className={styles.groupSearchWrap} ref={groupSearchRef}>
              <input
                type="text"
                className={styles.groupSearchInput}
                value={groupSearch}
                onChange={handleGroupSearchChange}
                onFocus={handleGroupSearchFocus}
                onKeyDown={handleGroupSearchKeyDown}
                placeholder={
                  locale === 'ko'
                    ? '최애 그룹을 검색하세요 (2글자 이상)'
                    : 'Search your favorite group (2+ chars)'
                }
                autoComplete="off"
                disabled={groupsFetching}
              />

              {showGroupDropdown && (
                <div className={styles.groupDropdown} role="listbox">
                  {filteredGroups.length === 0 ? (
                    <div className={styles.groupDropdownEmpty}>
                      {locale === 'ko' ? '검색 결과가 없습니다' : 'No results'}
                    </div>
                  ) : (
                    filteredGroups.map((group, index) => (
                      <div
                        key={group.id}
                        role="option"
                        tabIndex={-1}
                        aria-selected={highlightedGroupIndex === index}
                        className={`${styles.groupDropdownItem} ${
                          highlightedGroupIndex === index ? styles.groupDropdownItemActive : ''
                        }`}
                        onMouseDown={() => {
                          void handleSelectGroup(group);
                        }}
                        onMouseEnter={() => setHighlightedGroupIndex(index)}
                      >
                        <span className={styles.groupDropdownName}>{toDisplayGroupName(group)}</span>
                        <span className={styles.groupDropdownCompany}>
                          {getGroupCompanyName(group)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.section>

      {/* 계정 정보 */}
      <motion.section
        className={styles.accountSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className={styles.sectionTitle}>
          <User size={18} />
          Account
        </h3>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user?.email || '-'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Provider</span>
            <span className={styles.infoValue}>{providerLabel}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>User ID</span>
            <span className={styles.infoValue}>{user?.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </motion.section>

      {/* 로그아웃 버튼 */}
      <motion.div
        className={styles.actions}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <button type="button" className={styles.logoutBtn} onClick={handleSignOut}>
          <LogOut size={18} />
          {t('logout')}
        </button>
      </motion.div>
    </div>
  );
}
