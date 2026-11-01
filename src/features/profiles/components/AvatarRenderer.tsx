import React from 'react'
import type { AvatarConfig } from '../types'
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS, OUTFIT_COLORS, BACKGROUNDS } from '../data/avatarOptions'

export interface AvatarRendererProps {
  config: AvatarConfig
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isKids?: boolean
  className?: string
  animated?: boolean
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-20 h-20',
  lg: 'w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40',
  xl: 'w-44 h-44 sm:w-52 sm:h-52',
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  config,
  size = 'lg',
  isKids = false,
  className = '',
}) => {
  const containerSize = sizeClasses[size]

  return (
    <div
      className={`relative rounded-2xl overflow-hidden select-none shrink-0 shadow-lg ${containerSize} ${className}`}
      style={{
        background:
          (config.backgroundKey &&
            BACKGROUNDS.find((b) => b.key === config.backgroundKey)?.css) ||
          config.bgGradient,
      }}
    >
      {/* Dynamic Background Texture & Depth */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Illustrated Character SVG */}
      <svg
        className="relative w-full h-full"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Ambient Radial Lighting */}
          <radialGradient id={`glow-${config.id}`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={config.primaryColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={config.primaryColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Halo */}
        <circle cx="60" cy="50" r="45" fill={`url(#glow-${config.id})`} />

        {/* Render either the new layered artwork (Studio avatars) OR the original character artwork (predefined avatars) */}
        {(() => {
          const hasCustomLayers =
            config.skinToneKey ||
            config.hairStyleKey ||
            config.eyeStyleKey ||
            config.outfitKey ||
            config.accessoryKey;

          if (hasCustomLayers) {
            // ─── Studio-Created Avatar (layered rendering) ──────
            const skinColor = SKIN_TONES.find(s => s.key === config.skinToneKey)?.hex || '#E8D5C4';
            const hairColor = HAIR_COLORS.find(h => h.key === config.hairColorKey)?.hex || '#222428';
            const eyeColor = EYE_COLORS.find(e => e.key === config.eyeColorKey)?.hex || '#5A381E';
            const outfitColor = OUTFIT_COLORS.find(o => o.key === config.outfitColorKey)?.hex || '#C98769';
            const hairStyle = config.hairStyleKey || 'short';
            const eyeStyle = config.eyeStyleKey || 'round';
            const outfit = config.outfitKey || 'tshirt';
            const acc = config.accessoryKey;
            const accentColor = config.primaryColor;

            return (
              <>
                {/* 1. Outfit / Torso (drawn first, behind head) */}
                {(() => {
                  switch (outfit) {
                    case 'tshirt':
                      return (
                        <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill={outfitColor} />
                      );
                    case 'shirt':
                      return (
                        <g>
                          <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill={outfitColor} />
                          <path d="M50 86 L60 96 L70 86" stroke={outfitColor} strokeWidth="1.5" fill="none" filter="brightness(0.85)" />
                        </g>
                      );
                    case 'hoodie':
                      return (
                        <g>
                          <path d="M22 120 C22 94 36 86 50 84 L50 76 L70 76 L70 84 C84 86 98 94 98 120 Z" fill={outfitColor} />
                          <rect x="48" y="72" width="24" height="14" rx="5" fill={outfitColor} />
                        </g>
                      );
                    case 'jacket':
                      return (
                        <g>
                          <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill={outfitColor} />
                          <line x1="60" y1="86" x2="60" y2="120" stroke="#000" strokeOpacity="0.15" strokeWidth="1.5" />
                        </g>
                      );
                    case 'sweater':
                      return (
                        <g>
                          <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill={outfitColor} />
                          <rect x="48" y="74" width="24" height="12" rx="4" fill={outfitColor} opacity="0.85" />
                        </g>
                      );
                    default:
                      return <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill={outfitColor} />;
                  }
                })()}

                {/* 2. Head / Skin */}
                <ellipse cx="60" cy="52" rx="20" ry="24" fill={skinColor} />

                {/* 3. Hair */}
                {(() => {
                  switch (hairStyle) {
                    case 'bald':
                      return null;
                    case 'short':
                      return <path d="M38 50 C38 30 46 22 60 22 C74 22 82 30 82 46 C77 42 70 38 60 38 C48 38 42 44 38 50 Z" fill={hairColor} />;
                    case 'medium':
                      return <path d="M35 48 C35 28 48 20 60 20 C72 20 85 28 85 48 C80 44 70 38 60 38 C50 38 40 44 35 48 Z" fill={hairColor} />;
                    case 'long':
                      return (
                        <g fill={hairColor}>
                          <path d="M33 55 C33 20 48 12 60 12 C72 12 87 20 87 55 C82 48 72 42 60 42 C48 42 38 48 33 55 Z" />
                          <path d="M33 55 C33 62 35 72 38 78 C40 68 42 55 48 48 Z" />
                          <path d="M87 55 C87 62 85 72 82 78 C80 68 78 55 72 48 Z" />
                        </g>
                      );
                    case 'curly':
                      return (
                        <g fill={hairColor}>
                          <circle cx="42" cy="30" r="8" />
                          <circle cx="54" cy="24" r="8" />
                          <circle cx="66" cy="24" r="8" />
                          <circle cx="78" cy="30" r="8" />
                          <circle cx="38" cy="40" r="7" />
                          <circle cx="82" cy="40" r="7" />
                          <path d="M38 45 C38 30 48 22 60 22 C72 22 82 30 82 45 C77 40 70 36 60 36 C50 36 43 40 38 45 Z" />
                        </g>
                      );
                    case 'wavy':
                      return <path d="M36 52 C36 32 48 22 60 22 C72 22 84 32 84 52 C80 44 72 38 60 38 C48 38 40 44 36 52 Z" fill={hairColor} />;
                    default:
                      return null;
                  }
                })()}

                {/* 4. Eyes */}
                {(() => {
                  const eyeY = 55;
                  const leftX = 51;
                  const rightX = 69;
                  // White sclera
                  const sclera = (
                    <>
                      <ellipse cx={leftX} cy={eyeY} rx="5.5" ry="4" fill="#FAFAFA" />
                      <ellipse cx={rightX} cy={eyeY} rx="5.5" ry="4" fill="#FAFAFA" />
                    </>
                  );
                  switch (eyeStyle) {
                    case 'round':
                      return (
                        <>
                          {sclera}
                          <circle cx={leftX} cy={eyeY} r="3" fill={eyeColor} />
                          <circle cx={rightX} cy={eyeY} r="3" fill={eyeColor} />
                          <circle cx={leftX + 1} cy={eyeY - 1} r="1" fill="#FFF" />
                          <circle cx={rightX + 1} cy={eyeY - 1} r="1" fill="#FFF" />
                        </>
                      );
                    case 'almond':
                      return (
                        <>
                          {sclera}
                          <ellipse cx={leftX} cy={eyeY} rx="3.5" ry="2.5" fill={eyeColor} />
                          <ellipse cx={rightX} cy={eyeY} rx="3.5" ry="2.5" fill={eyeColor} />
                          <circle cx={leftX + 1} cy={eyeY - 0.5} r="1" fill="#FFF" />
                          <circle cx={rightX + 1} cy={eyeY - 0.5} r="1" fill="#FFF" />
                        </>
                      );
                    case 'narrow':
                      return (
                        <>
                          <ellipse cx={leftX} cy={eyeY} rx="5" ry="2.5" fill="#FAFAFA" />
                          <ellipse cx={rightX} cy={eyeY} rx="5" ry="2.5" fill="#FAFAFA" />
                          <ellipse cx={leftX} cy={eyeY} rx="3" ry="2" fill={eyeColor} />
                          <ellipse cx={rightX} cy={eyeY} rx="3" ry="2" fill={eyeColor} />
                        </>
                      );
                    default:
                      return null;
                  }
                })()}

                {/* 5. Simple mouth */}
                <path d="M55 64 C57 66 63 66 65 64" stroke="#A08070" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                {/* 6. Accessory */}
                {acc && acc !== 'none' && (() => {
                  switch (acc) {
                    case 'glasses':
                      return (
                        <g>
                          <circle cx="51" cy="53" r="7" stroke={accentColor} strokeWidth="2.5" fill="#202226" fillOpacity="0.7" />
                          <circle cx="69" cy="53" r="7" stroke={accentColor} strokeWidth="2.5" fill="#202226" fillOpacity="0.7" />
                          <path d="M58 53 L62 53" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M48 49 L52 47" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
                          <path d="M66 49 L70 47" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6" />
                        </g>
                      );
                    case 'sunglasses':
                      return (
                        <g>
                          <rect x="42" y="48" width="16" height="10" rx="3" fill="#1A1A1A" stroke={accentColor} strokeWidth="2" />
                          <rect x="62" y="48" width="16" height="10" rx="3" fill="#1A1A1A" stroke={accentColor} strokeWidth="2" />
                          <path d="M58 53 L62 53" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
                        </g>
                      );
                    case 'headphones':
                      return (
                        <g>
                          <path d="M36 52 C36 34 46 22 60 22 C74 22 84 34 84 52" stroke="#3A342D" strokeWidth="4" strokeLinecap="round" fill="none" />
                          <path d="M40 48 C40 36 48 26 60 26 C72 26 80 36 80 48" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                          <rect x="33" y="46" width="9" height="18" rx="4.5" fill={accentColor} />
                          <rect x="35" y="49" width="5" height="12" rx="2.5" fill="#25201A" />
                          <rect x="78" y="46" width="9" height="18" rx="4.5" fill={accentColor} />
                          <rect x="80" y="49" width="5" height="12" rx="2.5" fill="#25201A" />
                        </g>
                      );
                    case 'cap':
                      return (
                        <g>
                          <path d="M36 38 C36 26 46 20 60 20 C74 20 84 26 84 38 Z" fill={accentColor} />
                          <rect x="32" y="36" width="56" height="5" rx="2" fill={accentColor} />
                          <rect x="72" y="36" width="20" height="4" rx="2" fill={accentColor} opacity="0.8" />
                        </g>
                      );
                    case 'hat':
                      return (
                        <g>
                          <path d="M40 36 C40 20 48 14 60 14 C72 14 80 20 80 36 Z" fill={accentColor} />
                          <rect x="28" y="34" width="64" height="5" rx="2" fill={accentColor} />
                        </g>
                      );
                    default:
                      return null;
                  }
                })()}
              </>
            );
          }

          // ─── Original Predefined Avatars (unchanged) ──────────
          return (
            <>
              {/* 1. THE DIRECTOR / FILM BUFF (Aarav) */}
              {config.characterStyle === 'director' && (
                <g>
                  <path d="M40 25 L60 15 L75 30" stroke={config.primaryColor} strokeWidth="1" strokeOpacity="0.3" />
                  <path d="M75 30 L85 50 L70 65" stroke={config.primaryColor} strokeWidth="1" strokeOpacity="0.3" />
                  <path d="M70 65 L50 75 L35 60" stroke={config.primaryColor} strokeWidth="1" strokeOpacity="0.3" />
                  <path d="M25 120 C25 96 38 88 50 86 L50 78 L70 78 L70 86 C82 88 95 96 95 120 Z" fill="#1C1E22" />
                  <rect x="48" y="74" width="24" height="12" rx="4" fill="#26292E" />
                  <ellipse cx="60" cy="52" rx="20" ry="24" fill="#E8D5C4" />
                  <path d="M38 50 C38 30 46 22 60 22 C74 22 82 30 82 46 C77 42 70 38 60 38 C48 38 42 44 38 50 Z" fill="#222428" />
                  <circle cx="51" cy="52" r="7" stroke={config.primaryColor} strokeWidth="2.5" fill="#202226" fillOpacity="0.75" />
                  <circle cx="69" cy="52" r="7" stroke={config.primaryColor} strokeWidth="2.5" fill="#202226" fillOpacity="0.75" />
                  <path d="M58 52 L62 52" stroke={config.primaryColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M48 48 L52 46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
                  <path d="M66 48 L70 46" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
                </g>
              )}

              {/* 2. THE SOUND PRODUCER (Mira) */}
              {config.characterStyle === 'producer' && (
                <g>
                  <line x1="20" y1="50" x2="20" y2="70" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
                  <line x1="26" y1="40" x2="26" y2="80" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="94" y1="40" x2="94" y2="80" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
                  <line x1="100" y1="50" x2="100" y2="70" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
                  <path d="M26 120 C26 98 40 90 52 87 L52 79 L68 79 L68 87 C80 90 94 98 94 120 Z" fill="#211E1B" />
                  <path d="M52 88 L60 98 L68 88" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" />
                  <ellipse cx="60" cy="54" rx="19" ry="23" fill="#D9BA9B" />
                  <path d="M39 52 C39 32 48 24 60 24 C72 24 81 32 81 50 C81 64 78 72 75 76 C72 72 73 50 71 44 C67 38 52 38 46 44 C42 50 41 68 39 74 Z" fill="#181512" />
                  <path d="M36 54 C36 34 46 22 60 22 C74 22 84 34 84 54" stroke="#3A342D" strokeWidth="4" strokeLinecap="round" />
                  <path d="M40 50 C40 36 48 26 60 26 C72 26 80 36 80 50" stroke={config.primaryColor} strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="33" y="46" width="9" height="18" rx="4.5" fill={config.primaryColor} />
                  <rect x="35" y="49" width="5" height="12" rx="2.5" fill="#25201A" />
                  <rect x="78" y="46" width="9" height="18" rx="4.5" fill={config.primaryColor} />
                  <rect x="80" y="49" width="5" height="12" rx="2.5" fill="#25201A" />
                </g>
              )}

              {/* 3. THE VISUAL EXPLORER (Kabir) */}
              {config.characterStyle === 'explorer' && (
                <g>
                  <circle cx="60" cy="52" r="42" stroke={config.primaryColor} strokeWidth="0.75" strokeDasharray="4 4" strokeOpacity="0.4" />
                  <path d="M60 10 L60 20 M60 94 L60 104 M18 52 L28 52 M92 52 L102 52" stroke={config.primaryColor} strokeWidth="1" strokeOpacity="0.4" />
                  <path d="M24 120 C24 97 38 88 50 85 L50 78 L70 78 L70 85 C82 88 96 97 96 120 Z" fill="#1A2420" />
                  <path d="M60 85 L60 120" stroke={config.primaryColor} strokeWidth="2" strokeOpacity="0.6" />
                  <ellipse cx="60" cy="52" rx="19.5" ry="23.5" fill="#E2CFBB" />
                  <path d="M40 48 C40 32 48 23 60 23 C72 23 80 32 80 44 C77 38 72 34 60 34 C49 34 43 40 40 48 Z" fill="#151E1A" />
                  <rect x="42" y="46" width="36" height="8" rx="3" fill="#141E1A" stroke={config.primaryColor} strokeWidth="1.5" />
                  <line x1="45" y1="50" x2="75" y2="50" stroke={config.primaryColor} strokeWidth="1" strokeOpacity="0.7" />
                </g>
              )}

              {/* 4. THE PLAYFUL COMPANION (Kids) */}
              {config.characterStyle === 'cosmic-bot' && (
                <g>
                  <path d="M26 30 L28 24 L30 30 L36 32 L30 34 L28 40 L26 34 L20 32 Z" fill={config.primaryColor} opacity="0.6" />
                  <path d="M92 42 L93.5 38 L95 42 L99 43 L95 44 L93.5 48 L92 44 L88 43 Z" fill={config.secondaryColor} opacity="0.7" />
                  <circle cx="34" cy="74" r="2.5" fill={config.primaryColor} opacity="0.5" />
                  <circle cx="86" cy="78" r="3" fill={config.secondaryColor} opacity="0.5" />
                  <rect x="54" y="80" width="12" height="12" rx="3" fill="#2E2428" />
                  <path d="M34 120 C34 98 44 90 60 90 C76 90 86 98 86 120 Z" fill="#261E23" />
                  <circle cx="60" cy="104" r="5" fill={config.primaryColor} />
                  <rect x="36" y="34" width="48" height="46" rx="16" fill="#3D2933" stroke={config.primaryColor} strokeWidth="2.5" />
                  <line x1="60" y1="34" x2="60" y2="20" stroke={config.primaryColor} strokeWidth="3" strokeLinecap="round" />
                  <circle cx="60" cy="18" r="5.5" fill={config.primaryColor} />
                  <circle cx="60" cy="18" r="2.5" fill="#FFFFFF" />
                  <rect x="42" y="44" width="36" height="24" rx="8" fill="#181115" />
                  <path d="M48 54 C48 58 53 58 53 54" stroke={config.primaryColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M67 54 C67 58 72 58 72 54" stroke={config.primaryColor} strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M56 61 C58 63 62 63 64 61" stroke="#F4F0EA" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              )}

              {/* 5. CREATOR / CURATOR (Generic fallback) */}
              {(config.characterStyle === 'creator' || config.characterStyle === 'curator') && (
                <g>
                  <circle cx="60" cy="52" r="38" stroke={config.primaryColor} strokeWidth="1" strokeDasharray="6 4" strokeOpacity="0.4" />
                  <path d="M26 120 C26 98 40 90 60 90 C80 90 94 98 94 120 Z" fill="#202227" />
                  <ellipse cx="60" cy="54" rx="20" ry="24" fill="#D9C3B0" />
                  <path d="M38 50 C38 30 46 22 60 22 C74 22 82 30 82 46 Z" fill="#22262C" />
                  <circle cx="51" cy="52" r="6" stroke={config.primaryColor} strokeWidth="2" fill="#1C1E22" />
                  <circle cx="69" cy="52" r="6" stroke={config.primaryColor} strokeWidth="2" fill="#1C1E22" />
                  <path d="M57 52 L63 52" stroke={config.primaryColor} strokeWidth="2" />
                </g>
              )}
            </>
          );
        })()}
      </svg>

      {/* Subtle Kids Badge Overlay */}
      {isKids && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-[var(--accent-primary)]/40 text-[9px] font-mono font-bold tracking-wider text-[var(--accent-secondary)] uppercase">
          KIDS
        </div>
      )}
    </div>
  )
}
