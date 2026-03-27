import React from 'react';
import Svg, { Path, Circle, Polygon, Rect } from 'react-native-svg';
import { colors } from '../../theme/colors';

export type BadgeType =
  | 'first_registration'
  | 'active_registerer'
  | 'price_master'
  | 'first_verification'
  | 'verification_expert'
  | 'verification_master'
  | 'trusted_user'
  | 'highest_trust'
  | 'registration_10'
  | 'registration_50'
  | 'registration_200'
  | 'registration_500'
  | 'verification_10'
  | 'verification_50'
  | 'verification_200'
  | 'verification_500'
  | 'trust_70_30'
  | 'trust_85_60'
  | 'trust_95_90';

interface Props {
  type: BadgeType | (string & {});
  size?: number;
  earned?: boolean;
}

const INACTIVE_DARK = colors.gray400;

const BadgeIcon: React.FC<Props> = ({ type, size = 40, earned = true }) => {
  const c = earned ? colors.primary : colors.gray400;
  const d = earned ? colors.primaryDark : INACTIVE_DARK;
  const a = earned ? colors.accent : INACTIVE_DARK;
  const fill = earned ? colors.primaryLight : colors.gray200;

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 40 40',
    fill: 'none' as const,
  };

  switch (type) {
    // 첫 가격 등록: 가격 태그
    case 'first_registration':
      return (
        <Svg {...svgProps}>
          <Path
            d="M34 22.35L21.65 34.7a2.5 2.5 0 0 1-3.54 0L6 22.6V8h14.6L34 21.4a2.5 2.5 0 0 1 0 2.95z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="13" cy="15" r="2.5" fill={d} />
        </Svg>
      );

    // 활발한 등록자: 태그 2개 겹침
    case 'active_registerer':
      return (
        <Svg {...svgProps}>
          <Path
            d="M30 20.2L21.8 28.4a1.8 1.8 0 0 1-2.55 0L12 21.2V12h9.2L30 20.2z"
            fill={fill}
            stroke={d}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="15.5" cy="15.5" r="1.8" fill={d} />
          <Path
            d="M24 14l8 8-7 7"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M28 10l4 4"
            stroke={c}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );

    // 가격 마스터: 왕관
    case 'price_master':
      return (
        <Svg {...svgProps}>
          <Rect x="8" y="27" width="24" height="4" rx="2" fill={d} opacity={0.6} />
          <Path
            d="M8 27L12 13l8 7 8-11 4 18H8z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="8" cy="13" r="2.5" fill={a} />
          <Circle cx="20" cy="9" r="2.5" fill={a} />
          <Circle cx="32" cy="13" r="2.5" fill={a} />
        </Svg>
      );

    // 첫 검증 완료: 체크 원
    case 'first_verification':
      return (
        <Svg {...svgProps}>
          <Circle cx="20" cy="20" r="13" fill={fill} stroke={c} strokeWidth={2} />
          <Path
            d="M13 20.5l5 5 9-10"
            stroke={d}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // 검증 전문가: 방패 + 체크
    case 'verification_expert':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 6L8 11v9c0 7.5 5.3 14 12 15.5C26.7 34 32 27.5 32 20V11L20 6z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 20l4.5 4.5 8-9"
            stroke={d}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // 검증 마스터: 방패 + 별
    case 'verification_master':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 6L8 11v9c0 7.5 5.3 14 12 15.5C26.7 34 32 27.5 32 20V11L20 6z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polygon
            points="20,12 21.5,17 26.5,17 22.5,20 24,25 20,22 16,25 17.5,20 13.5,17 18.5,17"
            fill={a}
          />
        </Svg>
      );

    // 신뢰받는 사용자: 하트
    case 'trusted_user':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 33S6 24.35 6 15a9 9 0 0 1 14-7.48A9 9 0 0 1 34 15c0 9.35-14 18-14 18z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M20 27s-7-4.5-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 27 18c0 4.5-7 9-7 9z"
            fill={c}
            opacity={0.5}
          />
        </Svg>
      );

    // 최고 신뢰도: 트로피
    case 'highest_trust':
      return (
        <Svg {...svgProps}>
          <Path
            d="M13 8h14v13a7 7 0 0 1-14 0V8z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13 13H8a5 5 0 0 0 5 5M27 13h5a5 5 0 0 1-5 5"
            stroke={d}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M17 22v5M23 22v5M14 31h12"
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Polygon
            points="20,10 21.2,13.8 25.2,13.8 22,16.2 23.2,20 20,17.5 16.8,20 18,16.2 14.8,13.8 18.8,13.8"
            fill={a}
          />
        </Svg>
      );

    // ── 신규 등록 뱃지 ──────────────────────────────────────────────────────

    // registration_10: 가격 탐험가 — 심플 태그
    case 'registration_10':
      return (
        <Svg {...svgProps}>
          <Path
            d="M10 10h11l10 10-10 10H10a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="14" cy="20" r="2.5" fill={d} />
        </Svg>
      );

    // registration_50: 가격 수집가 — 태그 + 작은 별
    case 'registration_50':
      return (
        <Svg {...svgProps}>
          <Path
            d="M10 10h11l10 10-10 10H10a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="14" cy="20" r="2.5" fill={d} />
          <Polygon
            points="30,8 31.2,11.6 35,11.6 32,13.8 33.2,17.4 30,15.2 26.8,17.4 28,13.8 25,11.6 28.8,11.6"
            fill={a}
          />
        </Svg>
      );

    // registration_200: 가격 전문가 — 트로피
    case 'registration_200':
      return (
        <Svg {...svgProps}>
          <Path
            d="M13 8h14v12a7 7 0 0 1-14 0V8z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M13 13H8a5 5 0 0 0 5 5M27 13h5a5 5 0 0 1-5 5"
            stroke={d}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M17 22v4M23 22v4M14 30h12"
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      );

    // registration_500: 가격 마스터 — 왕관 + 보석 3개
    case 'registration_500':
      return (
        <Svg {...svgProps}>
          <Rect x="8" y="27" width="24" height="4" rx="2" fill={d} opacity={0.6} />
          <Path
            d="M8 27L12 13l8 7 8-11 4 18H8z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="8" cy="13" r="2.5" fill={a} />
          <Circle cx="20" cy="9" r="2.5" fill={a} />
          <Circle cx="32" cy="13" r="2.5" fill={a} />
        </Svg>
      );

    // ── 신규 검증 뱃지 ──────────────────────────────────────────────────────

    // verification_10: 가격 확인러 — 체크 원
    case 'verification_10':
      return (
        <Svg {...svgProps}>
          <Circle cx="20" cy="20" r="13" fill={fill} stroke={c} strokeWidth={2} />
          <Path
            d="M13 20.5l5 5 9-10"
            stroke={d}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // verification_50: 꼼꼼한 검증자 — 방패 + 체크
    case 'verification_50':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 6L8 11v9c0 7.5 5.3 14 12 15.5C26.7 34 32 27.5 32 20V11L20 6z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 20l4.5 4.5 8-9"
            stroke={d}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // verification_200: 검증 베테랑 — 방패 + 별
    case 'verification_200':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 6L8 11v9c0 7.5 5.3 14 12 15.5C26.7 34 32 27.5 32 20V11L20 6z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polygon
            points="20,12 21.5,17 26.5,17 22.5,20 24,25 20,22 16,25 17.5,20 13.5,17 18.5,17"
            fill={a}
          />
        </Svg>
      );

    // verification_500: 검증 마스터 — 이중 방패 + 별
    case 'verification_500':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 9L10 13v7c0 5.5 4 10.5 10 12 6-1.5 10-6.5 10-12v-7L20 9z"
            fill={fill}
            stroke={d}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
          <Path
            d="M20 5L7 10.5v9c0 7 5 13 13 15 8-2 13-8 13-15v-9L20 5z"
            fill="none"
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polygon
            points="20,11 21.4,15.8 26.5,15.8 22.4,18.7 23.8,23.5 20,20.6 16.2,23.5 17.6,18.7 13.5,15.8 18.6,15.8"
            fill={a}
          />
        </Svg>
      );

    // ── 신규 신뢰도 뱃지 ────────────────────────────────────────────────────

    // trust_70_30: 믿을 수 있는 이웃 — 하트 (심플)
    case 'trust_70_30':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 31C20 31 8 23 8 15a8 8 0 0 1 12-6.9A8 8 0 0 1 32 15c0 8-12 16-12 16z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    // trust_85_60: 동네 가격 지킴이 — 하트 + 별
    case 'trust_85_60':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 31C20 31 8 23 8 15a8 8 0 0 1 12-6.9A8 8 0 0 1 32 15c0 8-12 16-12 16z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Polygon
            points="20,14 21,17 24,17 21.5,18.8 22.5,21.8 20,20 17.5,21.8 18.5,18.8 16,17 19,17"
            fill={a}
          />
        </Svg>
      );

    // trust_95_90: 가격 수호자 — 다이아몬드
    case 'trust_95_90':
      return (
        <Svg {...svgProps}>
          <Path
            d="M20 6L34 18 20 36 6 18 20 6z"
            fill={fill}
            stroke={c}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6 18h28M12 12l8 6 8-6M12 24l8-6 8 6"
            stroke={d}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
          <Path
            d="M20 6l-8 12M20 6l8 12"
            stroke={c}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.5}
          />
        </Svg>
      );

    default:
      return (
        <Svg {...svgProps}>
          <Circle cx="20" cy="20" r="13" fill={fill} stroke={c} strokeWidth={2} />
          <Path
            d="M14 20l4.5 4.5 8-9"
            stroke={d}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
  }
};

export default BadgeIcon;
