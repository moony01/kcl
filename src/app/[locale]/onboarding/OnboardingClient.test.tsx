import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import koMessages from '@/messages/ko.json';
import OnboardingClient from './OnboardingClient';

const mockReplace = vi.fn();
const mockUseAuth = vi.fn();
const mockFrom = vi.fn();
const mockRefreshProfile = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/ko/onboarding',
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    from: mockFrom,
  }),
}));

const messages = { Onboarding: koMessages.Onboarding };

function createProfileQuery(username = '테스터') {
  const maybeSingle = vi.fn().mockResolvedValue({ data: { username }, error: null });
  const selectEq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq: selectEq });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });

  return { select, update, updateEq };
}

function createGroupsQuery(groups: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: groups, error: null });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });

  return { select, order };
}

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="ko" messages={messages}>
      <OnboardingClient />
    </NextIntlClientProvider>,
  );
}

describe('OnboardingClient', () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseAuth.mockReset();
    mockFrom.mockReset();
    mockRefreshProfile.mockReset();
    mockRefreshProfile.mockResolvedValue(undefined);
  });

  it('비로그인 상태에서 로그인 페이지로 리다이렉트한다', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
    });

    renderWithIntl();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ko/login');
    });
  });

  it('그룹 목록을 불러오고 한글/영문 검색이 동작한다', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
      refreshProfile: mockRefreshProfile,
    });

    const groups = [
      {
        id: 'group-aespa',
        name_ko: '에스파',
        name_en: 'aespa',
        company_id: 'company-sm',
        slug: 'aespa',
        group_type: 'girl',
        kcl_companies: { name_ko: 'SM', name_en: 'SM' },
      },
      {
        id: 'group-bts',
        name_ko: '방탄소년단',
        name_en: 'BTS',
        company_id: 'company-hybe',
        slug: 'bts',
        group_type: 'boy',
        kcl_companies: { name_ko: '하이브', name_en: 'HYBE' },
      },
    ];

    const groupsQuery = createGroupsQuery(groups);
    const profileQuery = createProfileQuery();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return groupsQuery;
      }
      if (table === 'kcl_user_profiles') {
        return profileQuery;
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    await waitFor(() => {
      expect(groupsQuery.order).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText('그룹 이름으로 검색...'), {
      target: { value: 'bts' },
    });

    await waitFor(() => {
      expect(screen.queryByText('에스파')).toBeNull();
      expect(screen.getByText('방탄소년단')).toBeDefined();
    });
  });

  it('그룹 선택 시 favorite_group_id를 저장하고 홈으로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
      refreshProfile: mockRefreshProfile,
    });

    const groups = [
      {
        id: 'group-aespa',
        name_ko: '에스파',
        name_en: 'aespa',
        company_id: 'company-sm',
        slug: 'aespa',
        group_type: 'girl',
        kcl_companies: { name_ko: 'SM', name_en: 'SM' },
      },
    ];

    const groupsQuery = createGroupsQuery(groups);
    const profileQuery = createProfileQuery();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return groupsQuery;
      }
      if (table === 'kcl_user_profiles') {
        return profileQuery;
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    await screen.findByDisplayValue('테스터');

    fireEvent.change(screen.getByPlaceholderText('그룹 이름으로 검색...'), {
      target: { value: '에스' },
    });

    fireEvent.mouseDown(await screen.findByText('에스파'));
    fireEvent.click(screen.getByRole('button', { name: '시작하기' }));

    await waitFor(() => {
      expect(profileQuery.update).toHaveBeenCalledWith({
        username: '테스터',
        favorite_group_id: 'group-aespa',
      });
      expect(profileQuery.updateEq).toHaveBeenCalledWith('id', 'user-1');
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/ko');
    });
  });

  it('건너뛰기 버튼 클릭 시 홈으로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
      refreshProfile: mockRefreshProfile,
    });

    const groupsQuery = createGroupsQuery([]);
    const profileQuery = createProfileQuery();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return groupsQuery;
      }
      if (table === 'kcl_user_profiles') {
        return profileQuery;
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    await screen.findByDisplayValue('테스터');
    fireEvent.click(screen.getByRole('button', { name: '나중에 하기' }));

    await waitFor(() => {
      expect(profileQuery.update).toHaveBeenCalledWith({ username: '테스터' });
      expect(profileQuery.updateEq).toHaveBeenCalledWith('id', 'user-1');
      expect(mockRefreshProfile).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/ko');
    });
  });
});
