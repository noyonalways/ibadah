/* eslint-disable react/no-unknown-property */
import type { ReactElement } from 'react';

/**
 * A reusable Open Graph card template, rendered as a React element via
 * `next/og`'s `ImageResponse`. Layout uses inline flex styles only
 * (Satori has limited CSS support).
 *
 * Sized 1200×630 — the canonical OG aspect ratio used by Twitter, LinkedIn,
 * Facebook, Slack, Discord, etc.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export type OgPalette = {
  /** Inner gradient (foreground) — usually emerald → gold */
  fromColor: string;
  midColor: string;
  toColor: string;
  /** Solid base behind everything */
  bgColor: string;
};

export const OG_PALETTE_DEFAULT: OgPalette = {
  fromColor: '#0f6e54',
  midColor: '#2a8e72',
  toColor: '#c8923a',
  bgColor: '#0a1f1a',
};

/**
 * Build the OG card element. The same element is reused across multiple
 * routes (root, /about, /faq) by varying the title / eyebrow / description.
 */
export function renderOgCard({
  brand,
  tagline,
  title,
  eyebrow,
  description,
  arabic,
  palette = OG_PALETTE_DEFAULT,
}: {
  brand: string;
  tagline: string;
  title: string;
  eyebrow: string;
  description: string;
  /** Optional Arabic accent line, rendered RTL */
  arabic?: string;
  palette?: OgPalette;
}): ReactElement {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: palette.bgColor,
        color: '#ffffff',
        position: 'relative',
        fontFamily: 'Inter, "Hind Siliguri", Amiri, sans-serif',
      }}
    >
      {/* Soft radial color wash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(60% 80% at 18% 15%, ${palette.fromColor}66 0%, transparent 60%), radial-gradient(60% 80% at 88% 95%, ${palette.toColor}55 0%, transparent 60%), radial-gradient(45% 70% at 75% 12%, ${palette.midColor}3a 0%, transparent 60%)`,
          display: 'flex',
        }}
      />

      {/* Subtle dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 12px 12px, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          display: 'flex',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 72,
          justifyContent: 'space-between',
        }}
      >
        {/* Header — logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <BadgeLogo size={88} fromColor={palette.fromColor} toColor={palette.toColor} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>{brand}</span>
            <span
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.62)',
                textTransform: 'uppercase',
                letterSpacing: 4,
                marginTop: 4,
              }}
            >
              {tagline}
            </span>
          </div>
        </div>

        {/* Center — title block */}
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
          <span
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
              letterSpacing: 6,
              marginBottom: 22,
            }}
          >
            {eyebrow}
          </span>

          <span
            style={{
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            {title}
          </span>

          <span
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.8)',
              marginTop: 26,
              maxWidth: 880,
            }}
          >
            {description}
          </span>
        </div>

        {/* Footer — arabic accent + url */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 28,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {arabic ? (
            <span
              style={{
                fontSize: 30,
                color: 'rgba(255,255,255,0.85)',
                direction: 'rtl',
                fontFamily: 'Amiri, Inter, sans-serif',
              }}
            >
              {arabic}
            </span>
          ) : (
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>
              Track Salah · Quran · Dhikr · Habits
            </span>
          )}
          <span
            style={{
              fontSize: 22,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 500,
              letterSpacing: 2,
            }}
          >
            ibadah.app
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Internal — renders the brand badge as inline SVG inside the card. This
 * mirrors `BrandLogo` but is inlined for Satori (which can't import React
 * components that use Tailwind classes / SSR styles).
 */
function BadgeLogo({
  size,
  fromColor,
  toColor,
}: {
  size: number;
  fromColor: string;
  toColor: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${fromColor} 0%, ${toColor} 100%)`,
        boxShadow: `0 18px 36px -16px ${fromColor}aa`,
      }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 64 64" fill="none">
        <g
          stroke="#ffffff"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth={2.4}
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
        <path d="M36 24 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16 z" fill="#ffffff" />
        <path
          d="M40 28.4 L40.9 30.7 L43.2 31.5 L40.9 32.3 L40 34.6 L39.1 32.3 L36.8 31.5 L39.1 30.7 Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
