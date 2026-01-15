export interface CompanyType {
  id: string;
  name: { en: string; ko: string };
  // 대표 아티스트 목록 (주요 기여 아티스트)
  representative: { en: string[]; ko: string[] };
  // 랭킹 점수
  firepower: number;
  rank: number;
  change: 'up' | 'down' | 'same';
  // UI용 그라데이션 컬러
  image: string;
  // 주가 변동 데이터 (30일)
  stockHistory: { date: string; value: number }[];
}


// Helper to generate random stock history
const generateHistory = (startValue: number) => {
  const history = [];
  let currentValue = startValue;
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Random fluctuation between -5% and +5%
    const change = (Math.random() - 0.48) * 0.1; 
    currentValue = currentValue * (1 + change);
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(currentValue)
    });
  }
  return history;
};

export const MOCK_COMPANIES: CompanyType[] = [
  // 1부 리그 (Top 10)
  {
    id: "co-hybe",
    name: { en: "HYBE", ko: "하이브" },
    representative: { 
      en: ["BTS", "SEVENTEEN", "NewJeans", "TXT"], 
      ko: ["방탄소년단", "세븐틴", "뉴진스", "투모로우바이투게더"] 
    },
    rank: 1,
    firepower: 154200300,
    change: "same",
    image: "linear-gradient(135deg, #E1D91A 0%, #1A1A1A 100%)",
    stockHistory: generateHistory(150000000)
  },
  {
    id: "co-sm",
    name: { en: "SM Entertainment", ko: "SM 엔터테인먼트" },
    representative: { 
      en: ["aespa", "NCT", "RIIZE", "Red Velvet"], 
      ko: ["에스파", "NCT", "라이즈", "레드벨벳"] 
    },
    rank: 2,
    firepower: 128500100,
    change: "up",
    image: "linear-gradient(135deg, #FF66A0 0%, #FF2E74 100%)",
    stockHistory: generateHistory(120000000)
  },
  {
    id: "co-jyp",
    name: { en: "JYP Entertainment", ko: "JYP 엔터테인먼트" },
    representative: { 
      en: ["Stray Kids", "TWICE", "ITZY", "NMIXX"], 
      ko: ["스트레이 키즈", "트와이스", "있지", "엔믹스"] 
    },
    rank: 3,
    firepower: 110200500,
    change: "down",
    image: "linear-gradient(135deg, #00B9F1 0%, #004F9F 100%)",
    stockHistory: generateHistory(115000000)
  },
  {
    id: "co-yg",
    name: { en: "YG Entertainment", ko: "YG 엔터테인먼트" },
    representative: { 
      en: ["BLACKPINK", "BABYMONSTER", "TREASURE", "AKMU"], 
      ko: ["블랙핑크", "베이비몬스터", "트레저", "악뮤"] 
    },
    rank: 4,
    firepower: 98000900,
    change: "same",
    image: "linear-gradient(135deg, #000000 0%, #444444 100%)",
    stockHistory: generateHistory(95000000)
  },
  {
    id: "co-starship",
    name: { en: "Starship Ent.", ko: "스타쉽 엔터" },
    representative: { 
      en: ["IVE", "Monsta X", "CRAVITY"], 
      ko: ["아이브", "몬스타엑스", "크래비티"] 
    },
    rank: 5,
    firepower: 76000200,
    change: "up",
    image: "linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)",
    stockHistory: generateHistory(72000000)
  },
  {
    id: "co-cube",
    name: { en: "Cube Ent.", ko: "큐브 엔터" },
    representative: { 
      en: ["(G)I-DLE", "BTOB"], 
      ko: ["(여자)아이들", "비투비"] 
    },
    rank: 6,
    firepower: 54000100,
    change: "same",
    image: "linear-gradient(135deg, #1CB5E0 0%, #000851 100%)",
    stockHistory: generateHistory(54000000)
  },
  {
    id: "co-wakeone",
    name: { en: "WakeOne", ko: "웨이크원" },
    representative: { 
      en: ["ZEROBASEONE", "Kep1er"], 
      ko: ["제로베이스원", "케플러"] 
    },
    rank: 7,
    firepower: 48000500,
    change: "down",
    image: "linear-gradient(135deg, #FF512F 0%, #DD2476 100%)",
    stockHistory: generateHistory(50000000)
  },
  {
    id: "co-blacklabel",
    name: { en: "The Black Label", ko: "더블랙레이블" },
    representative: { 
      en: ["Rosé", "Jeon Somi", "Taeyang"], 
      ko: ["로제", "전소미", "태양"] 
    },
    rank: 8,
    firepower: 42000000,
    change: "up",
    image: "linear-gradient(135deg, #111111 0%, #333333 100%)",
    stockHistory: generateHistory(40000000)
  },
  {
    id: "co-ist",
    name: { en: "IST Ent.", ko: "IST 엔터" },
    representative: { 
      en: ["The Boyz", "Apink"], 
      ko: ["더보이즈", "에이핑크"] 
    },
    rank: 9,
    firepower: 39000800,
    change: "same",
    image: "linear-gradient(135deg, #F09819 0%, #EDDE5D 100%)",
    stockHistory: generateHistory(39000000)
  },
  {
    id: "co-kq",
    name: { en: "KQ Ent.", ko: "KQ 엔터" },
    representative: { 
      en: ["ATEEZ", "xikers"], 
      ko: ["에이티즈", "싸이커스"] 
    },
    rank: 10,
    firepower: 35000200,
    change: "down",
    image: "linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)",
    stockHistory: generateHistory(36000000)
  },

  // 2부 리그 (Top 11 ~ 20)
  {
    id: "co-woollii",
    name: { en: "Woollim Ent.", ko: "울림 엔터" },
    representative: { 
      en: ["Golden Child", "DRIPPIN", "Rocket Punch"], 
      ko: ["골든차일드", "드리핀", "로켓펀치"] 
    },
    rank: 11,
    firepower: 28000000,
    change: "same",
    image: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
    stockHistory: generateHistory(28000000)
  },
  {
    id: "co-wm",
    name: { en: "WM Ent.", ko: "WM 엔터" },
    representative: { 
      en: ["OH MY GIRL", "ONF"], 
      ko: ["오마이걸", "온앤오프"] 
    },
    rank: 12,
    firepower: 26500000,
    change: "up",
    image: "linear-gradient(135deg, #00C6FB 0%, #005BEA 100%)",
    stockHistory: generateHistory(26500000)
  },
  {
    id: "co-fnc",
    name: { en: "FNC Ent.", ko: "FNC 엔터" },
    representative: { 
      en: ["P1Harmony", "SF9", "CNBLUE"], 
      ko: ["피원하모니", "SF9", "씨엔블루"] 
    },
    rank: 13,
    firepower: 24000000,
    change: "down",
    image: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
    stockHistory: generateHistory(24000000)
  },
  {
    id: "co-fantagio",
    name: { en: "Fantagio", ko: "판타지오" },
    representative: { 
      en: ["ASTRO", "Weki Meki", "LUN8"], 
      ko: ["아스트로", "위키미키", "루네이트"] 
    },
    rank: 14,
    firepower: 22000000,
    change: "same",
    image: "linear-gradient(135deg, #FFA17F 0%, #00223E 100%)",
    stockHistory: generateHistory(22000000)
  },
  {
    id: "co-rbw",
    name: { en: "RBW", ko: "RBW" },
    representative: { 
      en: ["MAMAMOO", "ONEUS", "PURPLE KISS"], 
      ko: ["마마무", "원어스", "퍼플키스"] 
    },
    rank: 15,
    firepower: 20000000,
    change: "up",
    image: "linear-gradient(135deg, #833AB4 0%, #FD1D1D 100%)",
    stockHistory: generateHistory(20000000)
  },
  {
    id: "co-jelly",
    name: { en: "Jellyfish Ent.", ko: "젤리피쉬" },
    representative: { 
      en: ["VERIVERY", "EVNNE"], 
      ko: ["베리베리", "이븐"] 
    },
    rank: 16,
    firepower: 18000000,
    change: "down",
    image: "linear-gradient(135deg, #FFEFBA 0%, #FFFFFF 100%)",
    stockHistory: generateHistory(18000000)
  },
  {
    id: "co-c9",
    name: { en: "C9 Ent.", ko: "C9 엔터" },
    representative: { 
      en: ["CIX", "EPEX", "cignature"], 
      ko: ["CIX", "이펙스", "시그니처"] 
    },
    rank: 17,
    firepower: 16500000,
    change: "same",
    image: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    stockHistory: generateHistory(16500000)
  },
  {
    id: "co-modhaus",
    name: { en: "Modhaus", ko: "모드하우스" },
    representative: { 
      en: ["tripleS", "ARTMS"], 
      ko: ["트리플에스", "아르테미스"] 
    },
    rank: 18,
    firepower: 15000000,
    change: "up",
    image: "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
    stockHistory: generateHistory(15000000)
  },
  {
    id: "co-bpm",
    name: { en: "BPM Ent.", ko: "빅플래닛메이드" },
    representative: { 
      en: ["VIVIZ", "Taemin", "BADVILLAIN"], 
      ko: ["비비지", "태민", "배드빌런"] 
    },
    rank: 19,
    firepower: 13000000,
    change: "same",
    image: "linear-gradient(135deg, #0F2027 0%, #203A43 100%)",
    stockHistory: generateHistory(13000000)
  },
  {
    id: "co-attrakt",
    name: { en: "ATTRAKT", ko: "어트랙트" },
    representative: { 
      en: ["FIFTY FIFTY"], 
      ko: ["피프티피프티"] 
    },
    rank: 20,
    firepower: 11000000,
    change: "down",
    image: "linear-gradient(135deg, #DA22FF 0%, #9733EE 100%)",
    stockHistory: generateHistory(11000000)
  }
];

export interface Vote {
  id: string;
  companyId: string; // 투표 대상 회사
  userId: string; // 투표한 유저
  groupId: string; // 유저가 팬인 아이돌 그룹
  labelId: string; // 그룹이 속한 레이블
  timestamp: number;
}

// 간단한 Mock Vote 데이터 생성 (Hydration Issue 방지를 위해 고정된 시드나 상수로 해야 하지만, 여기선 단순화)
// 실제로는 고정된 데이터를 사용하는 것이 좋습니다.
const generateMockVotes = (companyId: string, count: number) => {
  const voteData = [];
  // 회사별 그룹/레이블 매핑 (간단 예시)
  const groupMap: Record<string, {name: string, label: string}[]> = {
    // HYBE
    [MOCK_COMPANIES[0].id]: [
      { name: 'NewJeans', label: 'ADOR' },
      { name: 'BTS', label: 'BIGHIT' },
      { name: 'SEVENTEEN', label: 'PLEDIS' },
      { name: 'LE SSERAFIM', label: 'SOURCE' }
    ],
    // SM
    [MOCK_COMPANIES[1].id]: [
      { name: 'aespa', label: 'SM' },
      { name: 'NCT', label: 'SM' },
      { name: 'RIIZE', label: 'SM' }
    ],
    // JYP
    [MOCK_COMPANIES[2].id]: [
      { name: 'TWICE', label: 'JYP' },
      { name: 'Stray Kids', label: 'JYP' },
      { name: 'ITZY', label: 'JYP' }
    ]
  };

  const targets = groupMap[companyId] || [{ name: 'Unknown', label: 'Unknown' }];

  for(let i=0; i<count; i++) {
    // Round robin or simple random deterministic
    const target = targets[i % targets.length]; 
    voteData.push({
      id: `vote-${companyId}-${i}`,
      companyId,
      userId: `user-${1000 + i}`,
      groupId: target.name,
      labelId: target.label,
      timestamp: 1704067200000 + (i * 10000) // Fixed timestamps
    });
  }
  return voteData;
};

// HYBE, SM, JYP에 대한 투표 데이터 생성
export const MOCK_VOTES: Vote[] = [
  ...generateMockVotes(MOCK_COMPANIES[0].id, 150),
  ...generateMockVotes(MOCK_COMPANIES[1].id, 100),
  ...generateMockVotes(MOCK_COMPANIES[2].id, 80),
];
