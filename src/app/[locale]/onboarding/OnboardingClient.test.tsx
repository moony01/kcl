import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingClient from './OnboardingClient';

const mockReplace = vi.fn();
const mockUseAuth = vi.fn();
const mockFrom = vi.fn();

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

const messages = {
  Onboarding: {
    title: '최애 그룹을 선택하세요!',
    subtitle: '선택한 그룹의 소속사가 메인에 자동 설정됩니다',
    search_placeholder: '그룹 이름 검색...',
    skip: '나중에 하기',
    select: '선택',
    selected: '선택 완료!',
    saving: '저장 중...',
    my_favorite_group: '최애 그룹',
    change_group: '변경',
    set_group: '최애 그룹 설정',
    no_results: '검색 결과 없음',
  },
};

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

    const groupsOrder = vi.fn().mockResolvedValue({ data: groups, error: null });
    const groupsEq = vi.fn().mockReturnValue({ order: groupsOrder });
    const groupsSelect = vi.fn().mockReturnValue({ eq: groupsEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return { select: groupsSelect };
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    await waitFor(() => {
      expect(screen.getByText('에스파')).toBeDefined();
      expect(screen.getByText('방탄소년단')).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText('그룹 이름 검색...'), {
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

    const groupsOrder = vi.fn().mockResolvedValue({ data: groups, error: null });
    const groupsEq = vi.fn().mockReturnValue({ order: groupsOrder });
    const groupsSelect = vi.fn().mockReturnValue({ eq: groupsEq });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return { select: groupsSelect };
      }
      if (table === 'kcl_user_profiles') {
        return { update };
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    await waitFor(() => {
      expect(screen.getByText('에스파')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: '선택' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({ favorite_group_id: 'group-aespa' });
      expect(updateEq).toHaveBeenCalledWith('id', 'user-1');
      expect(mockReplace).toHaveBeenCalledWith('/ko');
    });
  });

  it('건너뛰기 버튼 클릭 시 홈으로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      isLoading: false,
    });

    const groupsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const groupsEq = vi.fn().mockReturnValue({ order: groupsOrder });
    const groupsSelect = vi.fn().mockReturnValue({ eq: groupsEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') {
        return { select: groupsSelect };
      }
      throw new Error(`unexpected table: ${table}`);
    });

    renderWithIntl();

    fireEvent.click(screen.getByRole('button', { name: '나중에 하기' }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/ko');
    });
  });
});
