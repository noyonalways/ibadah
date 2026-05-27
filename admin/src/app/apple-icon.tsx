import { ImageResponse } from 'next/og';

// 180×180 Apple touch icon — same logo, tuned for iOS home screens.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function AppleIcon() {
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
            'linear-gradient(135deg, #0f6e54 0%, #2fa483 55%, #c8923a 110%)',
        }}
      >
        <svg width="124" height="124" viewBox="0 0 64 64" fill="none">
          <g
            stroke="#ffffff"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth={2.6}
          >
            <rect x="13" y="13" width="38" height="38" rx="2" />
            <rect
              x="13"
              y="13"
              width="38"
              height="38"
              rx="2"
              transform="rotate(45 32 32)"
              opacity="0.78"
            />
            <circle cx="32" cy="32" r="14" strokeWidth="1.1" opacity="0.45" />
          </g>
          <path
            d="M36 24 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 z"
            fill="#ffffff"
          />
          <path
            d="M40 28.4 L40.9 30.7 L43.2 31.5 L40.9 32.3 L40 34.6 L39.1 32.3 L36.8 31.5 L39.1 30.7 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
