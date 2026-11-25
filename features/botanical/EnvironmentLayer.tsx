'use client';

import type { MutableRefObject } from 'react';
import { INITIAL_SEAGULLS } from './constants';
import { buildSeagullPath } from './treeGeometry';
import type { EnvironmentState } from './types';
import { clamp, tintForTime } from './utils';

type Props = {
  env: EnvironmentState;
  isWateredToday: boolean;
  treeBaseX: number;
  gullGroupRefs: MutableRefObject<(SVGGElement | null)[]>;
  gullPathRefs: MutableRefObject<(SVGPathElement | null)[]>;
};

export function EnvironmentLayer({
  env,
  isWateredToday,
  treeBaseX,
  gullGroupRefs,
  gullPathRefs,
}: Props) {
  const {
    sunX,
    sunY,
    sunOpacity,
    sunColor,
    moonX,
    moonY,
    moonOpacity,
    nightFactor,
    snowLevel,
    autumnWarmth,
  } = env;

  const beamTargetX = treeBaseX;
  const beamTargetY = 235;
  const rayDx = beamTargetX - sunX;
  const rayDy = beamTargetY - sunY;
  const rayLen = Math.hypot(rayDx, rayDy) || 1;
  const perpX = -rayDy / rayLen;
  const perpY = rayDx / rayLen;
  const sunbeamOpacity = sunOpacity * (snowLevel < 0.65 ? 1 : 0.45);

  const moonRayDx = beamTargetX - moonX;
  const moonRayDy = beamTargetY - moonY;
  const moonRayLen = Math.hypot(moonRayDx, moonRayDy) || 1;
  const moonPerpX = -moonRayDy / moonRayLen;
  const moonPerpY = moonRayDx / moonRayLen;
  const moonbeamOpacity = moonOpacity * nightFactor * 0.85;

  return (
    <g>
      <rect x="-20" y="-20" width="560" height="360" fill="url(#skyGrad)" />

      {(nightFactor > 0.1 || snowLevel > 0.5) && (
        <g
          fill="#FFFFFF"
          opacity={Math.max(
            nightFactor * 0.72,
            snowLevel > 0.5 ? clamp((snowLevel - 0.5) * 0.6, 0, 0.35) : 0
          )}
        >
          <circle cx="88" cy="42" r="1.2" />
          <circle cx="152" cy="28" r="1.0" />
          <circle cx="292" cy="34" r="1.3" />
          <circle cx="426" cy="52" r="1.1" />
          <circle cx="64" cy="92" r="0.9" />
          <circle cx="378" cy="26" r="1.1" />
        </g>
      )}

      {sunOpacity > 0.02 && (
        <g opacity={sunOpacity}>
          <circle cx={sunX} cy={sunY} r="78" fill="url(#sunHalo)" />
          <circle
            cx={sunX}
            cy={sunY}
            r="14"
            fill={sunColor}
            opacity={snowLevel > 0.5 ? '0.62' : '0.92'}
          />
        </g>
      )}

      {moonOpacity > 0.02 && (
        <g opacity={moonOpacity}>
          <circle cx={moonX} cy={moonY} r="44" fill="url(#moonHalo)" />
          <path
            d={`M ${(moonX + 3).toFixed(1)} ${(moonY - 10).toFixed(1)} A 10 10 0 1 0 ${(moonX + 10).toFixed(1)} ${(moonY + 4).toFixed(1)} A 8.5 8.5 0 1 1 ${(moonX + 3).toFixed(1)} ${(moonY - 10).toFixed(1)} Z`}
            fill="#F8FAFC"
          />
        </g>
      )}

      <g
        fill="#FFFFFF"
        opacity={nightFactor > 0.5 ? '0.16' : snowLevel > 0.5 ? '0.35' : '0.6'}
      >
        <path d="M52 54 C62 44, 84 44, 94 52 C104 48, 122 52, 126 60 L46 60 C44 57, 48 54, 52 54 Z" />
        <path d="M312 42 C320 35, 336 35, 344 41 C352 38, 364 41, 368 47 L306 47 C305 45, 308 42, 312 42 Z" />
      </g>

      {sunbeamOpacity > 0.05 && (
        <g className="sun-pulse" opacity={sunbeamOpacity}>
          <polygon
            points={`${(sunX - perpX * 14).toFixed(1)},${(sunY - perpY * 14).toFixed(1)} ${(sunX + perpX * 16).toFixed(1)},${(sunY + perpY * 16).toFixed(1)} ${(beamTargetX + perpX * 48).toFixed(1)},${(beamTargetY + perpY * 48).toFixed(1)} ${(beamTargetX - perpX * 42).toFixed(1)},${(beamTargetY - perpY * 42).toFixed(1)}`}
            fill="url(#sunBeam)"
          />
          <polygon
            points={`${(sunX - perpX * 4).toFixed(1)},${(sunY - perpY * 4).toFixed(1)} ${(sunX + perpX * 22).toFixed(1)},${(sunY + perpY * 22).toFixed(1)} ${(beamTargetX + 54 + perpX * 32).toFixed(1)},${(beamTargetY + 14 + perpY * 32).toFixed(1)} ${(beamTargetX + 18 - perpX * 16).toFixed(1)},${(beamTargetY + 6 - perpY * 16).toFixed(1)}`}
            fill="url(#sunBeam)"
            opacity="0.6"
          />
        </g>
      )}

      {moonbeamOpacity > 0.04 && (
        <g opacity={moonbeamOpacity}>
          <polygon
            points={`${(moonX - moonPerpX * 12).toFixed(1)},${(moonY - moonPerpY * 12).toFixed(1)} ${(moonX + moonPerpX * 14).toFixed(1)},${(moonY + moonPerpY * 14).toFixed(1)} ${(beamTargetX + moonPerpX * 56).toFixed(1)},${(beamTargetY + moonPerpY * 56).toFixed(1)} ${(beamTargetX - moonPerpX * 48).toFixed(1)},${(beamTargetY - moonPerpY * 48).toFixed(1)}`}
            fill="url(#moonBeam)"
          />
          <ellipse
            cx={treeBaseX + (moonX - 260) * 0.08}
            cy="226"
            rx="86"
            ry="52"
            fill="url(#moonKnollGlow)"
          />
        </g>
      )}

      <path
        d="M-20 235 L45 154 L96 176 L176 122 L248 168 L338 116 L418 162 L486 132 L540 168 L540 265 L-20 265 Z"
        fill={env.farMountain}
      />

      {snowLevel > 0.06 && (
        <g
          fill={tintForTime('#FFFFFF', nightFactor, '#94A3B8', 0.55)}
          opacity={0.85 * snowLevel}
        >
          <path d="M338 116 L310 138 L328 134 L340 145 L354 135 L368 142 Z" />
          <path d="M45 154 L28 170 L44 166 L54 173 L64 166 Z" />
          <path d="M176 122 L156 140 L170 137 L178 145 L192 138 Z" />
        </g>
      )}

      <g className="mist-drift">
        <rect x="-40" y="164" width="600" height="44" fill="url(#mistBand)" />
      </g>

      <path
        d="M-20 250 Q70 185 168 206 Q268 228 362 192 Q450 162 540 208 L540 280 L-20 280 Z"
        fill={env.midMountain}
      />

      <g fill={env.midMountain} opacity="0.88">
        <path d="M24 206 L30 186 L36 206 Z M42 200 L49 178 L56 200 Z M62 198 L68 181 L74 198 Z" />
        <path d="M402 184 L409 164 L416 184 Z M422 181 L428 160 L434 181 Z M442 184 L449 166 L456 184 Z" />
      </g>

      <g
        stroke={nightFactor > 0.45 ? '#CBD5E1' : '#334155'}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        {INITIAL_SEAGULLS.map((g, idx) => (
          <g
            key={idx}
            ref={(el) => {
              gullGroupRefs.current[idx] = el;
            }}
            transform={`translate(${g.x}, ${g.y}) scale(${g.scale})`}
            opacity={g.baseOpacity}
          >
            <path
              ref={(el) => {
                gullPathRefs.current[idx] = el;
              }}
              d={buildSeagullPath(-0.2, g.vx / g.cruiseSpeed)}
            />
          </g>
        ))}
      </g>

      <path
        d="M-20 278 Q105 244 256 248 Q390 252 540 276 L540 340 L-20 340 Z"
        fill="url(#hillGrad)"
      />
      <path d="M128 264 Q256 242 384 268 Q256 254 128 264 Z" fill="#000000" opacity="0.06" />

      <g>
        <path
          d="M362 272 C384 278, 370 292, 404 300 C432 307, 464 306, 512 326 L528 326 C476 300, 444 300, 416 294 C388 287, 398 276, 368 271 Z"
          fill={
            env.streamFrozen
              ? tintForTime('#E2E8F0', nightFactor, '#475569', 0.65)
              : 'url(#streamGrad)'
          }
          opacity={env.streamFrozen ? 0.85 : 1}
        />
        {(isWateredToday || nightFactor > 0.3) && !env.streamFrozen && (
          <g
            className="water-shimmer"
            stroke={nightFactor > 0.4 ? '#CBD5E1' : '#FFFFFF'}
            strokeWidth="1"
            strokeLinecap="round"
            opacity={nightFactor > 0.4 ? 0.72 : 0.9}
          >
            <path d="M432 301 Q444 304 456 307" />
          </g>
        )}
      </g>

      <g>
        <path
          d="M188 260 C190 247, 214 244, 224 257 C226 263, 190 264, 188 260 Z"
          fill={tintForTime('#64748B', nightFactor, '#1E293B', 0.65)}
        />
        <path
          d="M192 254 C198 247, 214 246, 220 253 C212 250, 199 251, 192 254 Z"
          fill={tintForTime(
            snowLevel > 0.3 ? '#F8FAFC' : '#4D7C0F',
            nightFactor,
            snowLevel > 0.3 ? '#94A3B8' : '#1E3A5F',
            0.6
          )}
        />
        <path
          d="M298 262 C302 250, 326 248, 334 261 C332 266, 300 266, 298 262 Z"
          fill={tintForTime('#475569', nightFactor, '#162032', 0.68)}
        />
        <path
          d="M303 256 C309 250, 324 250, 330 256 C322 253, 310 254, 303 256 Z"
          fill={tintForTime(
            snowLevel > 0.3 ? '#F8FAFC' : '#65A30D',
            nightFactor,
            snowLevel > 0.3 ? '#94A3B8' : '#264363',
            0.58
          )}
        />
      </g>

      <ellipse cx="263" cy="253" rx="36" ry="6.5" fill="url(#soilPocket)" />
      {isWateredToday && snowLevel < 0.7 && (
        <g fill="#BAE6FD" opacity="0.88">
          <circle cx="244" cy="252" r="1.2" />
          <circle cx="276" cy="254" r="1.4" />
          <circle cx="257" cy="255" r="1.0" />
        </g>
      )}

      {snowLevel < 0.55 && (
        <g
          stroke={tintForTime(
            autumnWarmth > 0.4 ? '#92400E' : '#3F7D20',
            nightFactor,
            '#1E3A5F',
            0.65
          )}
          strokeWidth="1.3"
          strokeLinecap="round"
        >
          <path d="M164 264 Q160 254 156 250 M166 264 Q167 253 171 249" />
          <path d="M230 256 Q227 248 223 245 M233 256 Q235 247 239 245" />
          <path d="M290 256 Q293 247 297 244 M293 256 Q298 249 302 247" />
          <path d="M348 268 Q345 258 341 254 M351 268 Q354 257 358 253" />
        </g>
      )}

      {(env.springFactor > 0.35 || env.summerFactor > 0.35) && snowLevel < 0.25 && (
        <g>
          <circle
            cx="155"
            cy="256"
            r="2.2"
            fill={tintForTime('#FEF08A', nightFactor, '#94A3B8', 0.62)}
          />
          <circle
            cx="172"
            cy="260"
            r="2.0"
            fill={tintForTime('#F5D0FE', nightFactor, '#64748B', 0.65)}
          />
          <circle
            cx="342"
            cy="261"
            r="2.2"
            fill={tintForTime('#FFFFFF', nightFactor, '#94A3B8', 0.55)}
          />
          <circle
            cx="356"
            cy="265"
            r="1.8"
            fill={tintForTime('#E0E7FF', nightFactor, '#64748B', 0.6)}
          />
        </g>
      )}

      {env.showButterfly && (
        <g transform="translate(332, 108)" opacity={1 - nightFactor * 2}>
          <g className="butterfly-hover">
            <path d="M0 0 C-7 -8, -11 0, -4 4 C-9 6, -5 11, 0 5 Z" fill="#FDE047" opacity="0.88" />
            <path d="M0 0 C7 -8, 11 0, 4 4 C9 6, 5 11, 0 5 Z" fill="#FEF08A" opacity="0.88" />
            <line x1="0" y1="-2" x2="0" y2="6" stroke="#78350F" strokeWidth="1" strokeLinecap="round" />
          </g>
        </g>
      )}

      {env.showSummerShimmer && (
        <g fill="#FEF08A" opacity={0.68 * (1 - nightFactor * 2)}>
          <circle cx="204" cy="182" r="1.8" />
          <circle cx="316" cy="156" r="2.1" />
          <circle cx="288" cy="204" r="1.4" />
          <circle cx="176" cy="148" r="1.6" />
        </g>
      )}

      {env.showFireflies && (
        <g className="water-shimmer" opacity={clamp((nightFactor - 0.35) / 0.4, 0, 0.9)}>
          <circle cx="192" cy="242" r="2.6" fill="#BEF264" opacity="0.25" />
          <circle cx="192" cy="242" r="1.2" fill="#ECFCCB" />
          <circle cx="338" cy="252" r="2.8" fill="#FEF08A" opacity="0.25" />
          <circle cx="338" cy="252" r="1.3" fill="#FEF9C3" />
          <circle cx="386" cy="278" r="2.4" fill="#BEF264" opacity="0.24" />
          <circle cx="386" cy="278" r="1.1" fill="#ECFCCB" />
        </g>
      )}

      {env.showPetals && (
        <g>
          <g className="petal-fall-a">
            <path d="M220 112 C226 108, 230 116, 223 120 C219 119, 217 115, 220 112 Z" fill="#FDF2F8" />
            <path d="M312 138 C318 134, 322 142, 315 146 C311 145, 309 141, 312 138 Z" fill="#FBCFE8" />
          </g>
          <g className="petal-fall-b">
            <path d="M276 92 C282 88, 286 96, 279 100 C275 99, 273 95, 276 92 Z" fill="#FFFFFF" />
            <path d="M188 148 C194 144, 198 152, 191 156 C187 155, 185 151, 188 148 Z" fill="#FBCFE8" />
          </g>
        </g>
      )}

      {env.showAutumnLeaves && (
        <g opacity={clamp(autumnWarmth * 1.1, 0.3, 0.9)}>
          {[
            { x: 174, y: 263, c: '#EA580C' },
            { x: 202, y: 265, c: '#CA8A04' },
            { x: 228, y: 256, c: '#DC2626' },
            { x: 248, y: 258, c: '#B45309' },
            { x: 276, y: 257, c: '#EA580C' },
            { x: 294, y: 261, c: '#CA8A04' },
            { x: 326, y: 266, c: '#9A3412' },
            { x: 344, y: 268, c: '#B45309' },
          ].map((lf, idx) => (
            <path
              key={`env-leaf-${idx}`}
              d={`M ${lf.x} ${lf.y} C ${lf.x + 5} ${lf.y - 3}, ${lf.x + 11} ${lf.y - 2}, ${lf.x + 13} ${lf.y} C ${lf.x + 9} ${lf.y + 3}, ${lf.x + 4} ${lf.y + 2}, ${lf.x} ${lf.y} Z`}
              fill={tintForTime(lf.c, nightFactor, '#3B2F2F', 0.65)}
            />
          ))}
        </g>
      )}

      {env.showSnowfall && (
        <g fill={tintForTime('#FFFFFF', nightFactor, '#CBD5E1', 0.45)}>
          <g className="petal-fall-a" opacity={0.85 * snowLevel}>
            <circle cx="118" cy="72" r="2.1" />
            <circle cx="224" cy="54" r="1.8" />
            <circle cx="332" cy="86" r="2.3" />
            <circle cx="408" cy="112" r="1.6" />
          </g>
          <g className="petal-fall-b" opacity={0.75 * snowLevel}>
            <circle cx="164" cy="96" r="1.7" />
            <circle cx="284" cy="68" r="2.2" />
            <circle cx="366" cy="58" r="1.5" />
            <circle cx="96" cy="136" r="1.9" />
          </g>
        </g>
      )}
    </g>
  );
}
