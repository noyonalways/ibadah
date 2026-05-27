import { ImageResponse } from 'next/og';

// Tiny 32×32 favicon, generated at build time. Mirrors the design of
// `BrandLogo` but reduced to readable strokes at 32px.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f6e54 0%, #2fa483 50%, #c8923a 100%)',
          borderRadius: 7,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
          <g
            stroke="#ffffff"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth={4}
          >
            <rect x="13" y="13" width="38" height="38" rx="2" />
            <rect
              x="13"
              y="13"
              width="38"
              height="38"
              rx="2"
              transform="rotate(45 32 32)"
              opacity="0.7"
            />
          </g>
          <path
            d="M36 24 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
