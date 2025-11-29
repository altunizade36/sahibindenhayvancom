export interface SellerLevel {
  id: string;
  name: string;
  nameEn: string;
  minScore: number;
  maxScore: number;
  color: string;
  bgColor: string;
  benefits: string[];
  benefitsEn: string[];
}

export const SELLER_LEVELS: SellerLevel[] = [
  {
    id: 'bronze',
    name: 'Bronz Satici',
    nameEn: 'Bronze Seller',
    minScore: 0,
    maxScore: 99,
    color: '#CD7F32',
    bgColor: '#FDF5E6',
    benefits: [
      'Temel ilan ozellikleri',
      'Mesajlasma',
      'Favori takibi'
    ],
    benefitsEn: [
      'Basic listing features',
      'Messaging',
      'Favorites tracking'
    ]
  },
  {
    id: 'silver',
    name: 'Gumus Satici',
    nameEn: 'Silver Seller',
    minScore: 100,
    maxScore: 299,
    color: '#C0C0C0',
    bgColor: '#F5F5F5',
    benefits: [
      'Bronz avantajlari',
      'Oncelikli listeleme',
      'Guvenilir satici rozeti'
    ],
    benefitsEn: [
      'Bronze benefits',
      'Priority listing',
      'Trusted seller badge'
    ]
  },
  {
    id: 'gold',
    name: 'Altin Satici',
    nameEn: 'Gold Seller',
    minScore: 300,
    maxScore: 599,
    color: '#FFD700',
    bgColor: '#FFFACD',
    benefits: [
      'Gumus avantajlari',
      'Ozel musteri destegi',
      'Detayli istatistikler',
      'Premium rozet'
    ],
    benefitsEn: [
      'Silver benefits',
      'Priority support',
      'Detailed analytics',
      'Premium badge'
    ]
  },
  {
    id: 'platinum',
    name: 'Platin Satici',
    nameEn: 'Platinum Seller',
    minScore: 600,
    maxScore: 999,
    color: '#E5E4E2',
    bgColor: '#F0F0F0',
    benefits: [
      'Altin avantajlari',
      'Ana sayfa one cikma',
      'Ozel promosyonlar',
      'VIP destek hatti'
    ],
    benefitsEn: [
      'Gold benefits',
      'Homepage featuring',
      'Special promotions',
      'VIP support line'
    ]
  },
  {
    id: 'diamond',
    name: 'Elmas Satici',
    nameEn: 'Diamond Seller',
    minScore: 1000,
    maxScore: Infinity,
    color: '#B9F2FF',
    bgColor: '#E0FFFF',
    benefits: [
      'Platin avantajlari',
      'Ozel etkinliklere davet',
      'Markalasma destegi',
      'Komisyonsuz satislar',
      'Ozel API erisimi'
    ],
    benefitsEn: [
      'Platinum benefits',
      'Exclusive event invites',
      'Branding support',
      'Commission-free sales',
      'API access'
    ]
  }
];

export const SELLER_BADGES = [
  { id: 'verified', name: 'Dogrulanmis', nameEn: 'Verified', icon: 'BadgeCheck' },
  { id: 'fast_response', name: 'Hizli Yanit', nameEn: 'Fast Response', icon: 'Zap' },
  { id: 'top_rated', name: 'En Cok Begenilen', nameEn: 'Top Rated', icon: 'Star' },
  { id: 'trusted', name: 'Guvenilir', nameEn: 'Trusted', icon: 'Shield' },
  { id: 'experienced', name: 'Deneyimli', nameEn: 'Experienced', icon: 'Award' },
  { id: 'professional', name: 'Profesyonel', nameEn: 'Professional', icon: 'Briefcase' },
];

export function calculateSellerScore(stats: {
  totalListings: number;
  totalSales: number;
  totalViews: number;
  responseRate: number;
  positiveReviews: number;
  negativeReviews: number;
  accountAgeDays: number;
}): number {
  let score = 0;
  
  score += stats.totalListings * 2;
  score += stats.totalSales * 10;
  score += Math.floor(stats.totalViews / 100);
  score += stats.responseRate * 0.5;
  score += stats.positiveReviews * 5;
  score -= stats.negativeReviews * 10;
  score += Math.floor(stats.accountAgeDays / 30) * 3;
  
  return Math.max(0, Math.round(score));
}

export function getSellerLevel(score: number): SellerLevel {
  for (const level of SELLER_LEVELS) {
    if (score >= level.minScore && score <= level.maxScore) {
      return level;
    }
  }
  return SELLER_LEVELS[0];
}
