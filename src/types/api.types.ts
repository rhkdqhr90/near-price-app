// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<UserResponse, 'id' | 'email' | 'nickname' | 'trustScore'>;
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
  latitude: number | null;
  longitude: number | null;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export type StoreType =
  | 'large_mart'
  | 'mart'
  | 'supermarket'
  | 'convenience'
  | 'traditional_market';

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
  user: UserResponse;
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

// ─── Search ────────────────────────────────────────────────────────────────

export interface SearchProductResult {
  id: string;
  name: string;
  score: number;
  highlight: string[];
}

// ─── Error ─────────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}
