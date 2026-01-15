/**
 * 소속사 데이터 변환 유틸리티
 *
 * Supabase DB 데이터를 레거시 Mock 타입으로 변환합니다.
 * 점진적 마이그레이션을 위한 어댑터 레이어입니다.
 */

import type { CompanyType } from '@/lib/mock-data';
import type { CompaniesResponse, CompanyDetailResponse } from '@/types/api';

/** DB 소속사를 CompanyType(레거시)으로 변환 */
export function dbCompanyToLegacy(
  company: CompaniesResponse['companies'][number],
  groups?: CompanyDetailResponse['groups'],
): CompanyType {
  // 대표 아티스트 목록 (그룹 정보가 있으면 사용, 없으면 빈 배열)
  const representativeEn = groups?.slice(0, 4).map((g) => g.name_en) || [];
  const representativeKo = groups?.slice(0, 4).map((g) => g.name_ko) || [];

  return {
    id: company.id,
    name: {
      en: company.name_en,
      ko: company.name_ko,
    },
    representative: {
      en: representativeEn,
      ko: representativeKo,
    },
    firepower: company.firepower,
    rank: company.rank,
    // DB에서는 순위 변동 정보가 없으므로 'same'으로 기본 설정
    change: 'same',
    // gradient_color를 CSS gradient로 변환
    image: company.gradient_color
      ? `linear-gradient(135deg, ${company.gradient_color} 0%, #1A1A1A 100%)`
      : 'linear-gradient(135deg, #8B5CF6 0%, #1A1A1A 100%)',
    // 주가 히스토리는 별도 API로 제공 예정
    stockHistory: generateMockHistory(company.firepower),
  };
}

/**
 * Mock 주가 히스토리 생성
 * TODO: 실제 투표 히스토리 API로 대체
 */
function generateMockHistory(currentValue: number) {
  const history = [];
  let value = currentValue * 0.9; // 30일 전 기준 90%
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // 랜덤 변동 (-3% ~ +3%)
    const change = (Math.random() - 0.48) * 0.06;
    value = Math.max(0, value * (1 + change));
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
    });
  }

  // 마지막 값은 현재 firepower와 일치하도록
  if (history.length > 0) {
    history[history.length - 1].value = currentValue;
  }

  return history;
}

/** 여러 소속사를 일괄 변환 */
export function dbCompaniesToLegacy(companies: CompaniesResponse['companies']): CompanyType[] {
  return companies.map((c) => dbCompanyToLegacy(c));
}
