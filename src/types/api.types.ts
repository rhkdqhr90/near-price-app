// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<UserResponse, 'id' | 'email' | 'nickname' | 'profileImageUrl' | 'trustScore'>;
}

export interface KakaoLoginDto {
  kakaoAccessToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// ─── User ──────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNicknameDto {
  nickname: string;
}

export interface CheckNicknameResponseDto {
  available: boolean;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export type StoreType =
  | 'large_mart'
  | 'mart'
  | 'supermarket'
  | 'convenience'
  | 'traditional_market'
  | (string & {}); // 커스텀 카테고리를 위한 문자열 지원

export interface StoreResponse {
  id: string;
  name: string;
  type: StoreType;
  latitude: number;
  longitude: number;
  address: string;
  externalPlaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NearbyStoreResponse {
  id: string;
  name: string;
  type: StoreType;
  latitude: number;
  longitude: number;
  address: string;
  distance: number;
}

export interface CreateStoreDto {
  name: string;
  type: StoreType;
  latitude: number;
  longitude: number;
  address: string;
  externalPlaceId?: string;
}

// ─── Product ───────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'vegetable'
  | 'fruit'
  | 'meat'
  | 'seafood'
  | 'dairy'
  | 'grain'
  | 'processed'
  | 'household'
  | 'other';

export type UnitType =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'count'
  | 'bunch'
  | 'pack'
  | 'bag'
  | 'other';

export interface ProductResponse {
  id: string;
  name: string;
  category: ProductCategory;
  unitType: UnitType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  category: ProductCategory;
  unitType: UnitType;
}

// ─── Price ─────────────────────────────────────────────────────────────────

export interface PriceResponse {
  id: string;
  user: UserResponse | null;
  store: StoreResponse;
  product: ProductResponse;
  price: number;
  quantity: number | null;
  imageUrl: string;
  saleStartDate: string | null;
  saleEndDate: string | null;
  condition: string | null;
  likeCount: number;
  reportCount: number;
  trustScore: number | null;
  verificationCount: number;
  confirmedCount: number;
  disputedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePriceDto {
  storeId: string;
  productId: string;
  price: number;
  imageUrl: string;
  quantity?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  condition?: string;
}

export interface UpdatePriceDto {
  price?: number;
  quantity?: number;
  imageUrl?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  condition?: string;
}

// ─── Price Submit (네비게이션 파라미터) ────────────────────────────────────

export interface PriceSubmitData {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
  unitType: UnitType;
  condition?: string;
  imageUri: string;
}

// ─── Wishlist ──────────────────────────────────────────────────────────────

export interface WishlistItem {
  productId: string;
  productName: string;
  category: ProductCategory;
  unitType: UnitType;
  lowestPrice: number | null;
  lowestPriceStoreName: string | null;
  addedAt: string;
}

export interface WishlistResponse {
  totalCount: number;
  items: WishlistItem[];
}

// ─── Upload ────────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
}

// ─── Notice ────────────────────────────────────────────────────────────────

export interface NoticeResponse {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

export interface FaqItemResponse {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface FaqGroupResponse {
  category: string | null;
  items: FaqItemResponse[];
}

// ─── Reaction ──────────────────────────────────────────────────────────────

export type ReactionType = 'confirm' | 'report';

export interface ReactionResponse {
  confirmCount: number;
  reportCount: number;
  myReaction: ReactionType | null;
}

// ─── Verification (신뢰도 검증) ──────────────────────────────────────────

export type VerificationResult = 'confirmed' | 'disputed';

export interface CreateVerificationDto {
  result: VerificationResult;
  actualPrice?: number;
}

export interface VerifierProfile {
  id: string;
  nickname: string;
  trustScore: number;
  representativeBadge?: {
    type: string;
    name: string;
    icon: string;
  } | null;
  profileImageUrl?: string | null;
}

export interface VerificationDetail {
  id: string;
  result: VerificationResult;
  actualPrice: number | null;
  verifier: VerifierProfile;
  createdAt: string;
}

export interface VerificationListResponse {
  data: VerificationDetail[];
  meta: {
    total: number;
    confirmedCount: number;
    disputedCount: number;
  };
}

export interface VerificationResponse {
  id: string;
  priceId: string;
  result: VerificationResult;
  actualPrice: number | null;
  newPriceId: string | null;
  createdAt: string;
}

export interface PriceTrustScoreResponse {
  priceId: string;
  trustScore: number | null;
  status: 'scored' | 'verifying' | 'new';
  verificationCount: number;
  confirmedCount: number;
  disputedCount: number;
  isStale: boolean;
  registeredAt: string;
  daysSinceRegistered: number;
}

// ─── Trust Score & Badges ────────────────────────────────────────────────

export interface UserTrustScoreResponse {
  userId: string;
  trustScore: number;
  registrationScore: number;
  verificationScore: number;
  consistencyBonus: number;
  totalRegistrations: number;
  totalVerifications: number;
  calculatedAt: string;
}

export interface BadgeInfo {
  type: string;
  name: string;
  icon: string;
  category: 'registration' | 'verification' | 'trust';
  earnedAt?: string;
}

export interface BadgeProgress {
  type: string;
  name: string;
  icon: string;
  category: 'registration' | 'verification' | 'trust';
  current: number;
  threshold: number;
  progressPercent: number;
}

export interface UserBadgesResponse {
  earned: BadgeInfo[];
  progress: BadgeProgress[];
}

// ─── Search ────────────────────────────────────────────────────────────────

export interface SearchProductResult {
  id: string;
  name: string;
  score: number;
  highlight: string[];
}

// ─── Inquiry ───────────────────────────────────────────────────────────────

export interface InquiryResponse {
  id: string;
  title: string;
  content: string;
  email: string;
  status: 'pending' | 'answered' | 'closed';
  adminReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInquiryDto {
  title: string;
  content: string;
  email: string;
}

// ─── Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
