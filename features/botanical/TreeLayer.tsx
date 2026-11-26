'use client';

import type { CSSProperties } from 'react';
import { BotanicalTree } from './botanicalTree/BotanicalTree';
import type { EnvironmentState, SpeciesConfig } from './types';
import { clamp, getTreeBaseX, lerp, lerpColor, tintForTime } from './utils';

type Props = {
  days: number;
  species: SpeciesConfig;
  env: EnvironmentState;
  isWateredToday: boolean;
  treeBaseX: number;
};

const COTYLEDON_L = 'M0 0 C-7 -7, -18 -5, -19 0 C-16 5, -5 4, 0 0 Z';
const COTYLEDON_R = 'M0 0 C7 -7, 18 -5, 19 0 C16 5, 5 4, 0 0 Z';
/** 双葉が落ちる日（左・右） */
const COTYLEDON_DROP = [33, 36];

type CSSVars = CSSProperties & Record<`--${string}`, string>;

export function TreeLayer({ days, species, env, isWateredToday, treeBaseX }: Props) {
  const cycle = days === 0 ? 1 : Math.floor((days - 1) / 360) + 1;
  const cd = days === 0 ? 0 : ((days - 1) % 360) + 1;
  const isSecondGen = cycle >= 2;
  const prevTreeX = getTreeBaseX(cycle - 1);
  // 2 代目以降の芽は、切り株から離れる向きに少し傾いて伸びる
  const lean = isSecondGen ? Math.sign(treeBaseX - prevTreeX) * 4 : 0;

  const isSproutPhase = days >= 1 && cd <= 23;
  const sproutG = clamp((cd - 1) / 22, 0, 1);
  const sproutH = lerp(8, 46, Math.pow(sproutG, 0.85));
  const sproutWave = Math.sin(sproutG * Math.PI * 2.1) * 4.5 * Math.sin(sproutG * Math.PI);
  const sproutHook = cd <= 10 ? lerp(8, 0, clamp((cd - 1) / 9, 0, 1)) : 0;
  const swayClass = 'mountain-tree-sway';

  // 若木になった後も双葉はしばらく残り、黄色くなってから 1 枚ずつ落ちる
  const cotyledonAge = clamp((cd - 24) / 9, 0, 1);
  const cotyledonFill = tintForTime(lerpColor(species.sproutColors.cotyledon, '#C9A227', cotyledonAge), env.nightFactor, '#355678', 0.62);
  const cotyledonStroke = tintForTime(lerpColor(species.sproutColors.cotyledonStroke, '#8A6A1E', cotyledonAge), env.nightFactor, '#16283E', 0.68);

  return (
    <g>
      {isSecondGen && (
        // 前の世代の木：その場で葉と枝を落とし、苔むした切り株になって土に還っていく
        <g transform={`translate(${prevTreeX}, 253)`}>
          <BotanicalTree species={species} cd={360} env={env} isWateredToday={false} decayDay={Math.max(1, cd)} />
        </g>
      )}

      {days === 0 && (
        <g>
          <path
            d="M254 252 C254 244, 266 244, 266 252 C266 256, 254 256, 254 252 Z"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="1"
          />
          <path d="M260 246 L260 254" stroke="#D97706" strokeWidth="0.9" opacity="0.7" />
        </g>
      )}

      {isSproutPhase && (
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
          <g className={swayClass}>
            <path
              d={`M -1.6 0 Q ${(-2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, ${(
                lean + sproutHook * 0.5
              ).toFixed(1)} ${(-sproutH).toFixed(1)}
              L ${(lean + 1.4 + sproutHook * 0.5).toFixed(1)} ${(-sproutH).toFixed(1)}
              Q ${(1.2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, 1.6 0 Z`}
              fill={tintForTime(species.sproutColors.stem, env.nightFactor, '#1E3A5F', 0.62)}
            />
            <g
              transform={`translate(${(lean * 0.5 + sproutWave * 0.5).toFixed(1)}, ${(
                -sproutH * 0.48
              ).toFixed(1)}) rotate(${sproutHook * 3.5})`}
            >
              <path
                d="M0 0 C-7 -7, -18 -5, -19 0 C-16 5, -5 4, 0 0 Z"
                fill={tintForTime(species.sproutColors.cotyledon, env.nightFactor, '#355678', 0.62)}
                stroke={tintForTime(species.sproutColors.cotyledonStroke, env.nightFactor, '#16283E', 0.68)}
                strokeWidth="0.6"
              />
              <path
                d="M0 0 C7 -7, 18 -5, 19 0 C16 5, 5 4, 0 0 Z"
                fill={tintForTime(species.sproutColors.cotyledon, env.nightFactor, '#355678', 0.62)}
                stroke={tintForTime(species.sproutColors.cotyledonStroke, env.nightFactor, '#16283E', 0.68)}
                strokeWidth="0.6"
              />
            </g>
            {cd >= 8 && (
              <g
                transform={`translate(${(lean + sproutHook * 0.5).toFixed(1)}, ${(
                  -sproutH
                ).toFixed(1)}) scale(${clamp((cd - 7) / 14, 0.3, 1)})`}
              >
                <path
                  d="M0 0 C-9 -12, -22 -10, -24 -2 C-19 5, -7 4, 0 0 Z"
                  fill={tintForTime(species.sproutColors.leaf, env.nightFactor, '#3B6085', 0.62)}
                  stroke={tintForTime(species.sproutColors.leafStroke, env.nightFactor, '#16283E', 0.68)}
                  strokeWidth="0.6"
                />
                <path
                  d="M0 0 C9 -12, 22 -10, 24 -2 C19 5, 7 4, 0 0 Z"
                  fill={tintForTime(species.sproutColors.leaf, env.nightFactor, '#3B6085', 0.62)}
                  stroke={tintForTime(species.sproutColors.leafStroke, env.nightFactor, '#16283E', 0.68)}
                  strokeWidth="0.6"
                />
                <path
                  d="M0 0 C-4 -10, -3 -20, 0 -24 C3 -20, 4 -10, 0 0 Z"
                  fill={tintForTime(species.sproutColors.tipLeaf, env.nightFactor, '#5B80A3', 0.58)}
                  stroke={tintForTime(species.sproutColors.leafStroke, env.nightFactor, '#16283E', 0.68)}
                  strokeWidth="0.5"
                />
              </g>
            )}
          </g>
        </g>
      )}

      {days >= 1 && cd >= 24 && (
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
          <g className={swayClass}>
            <BotanicalTree species={species} cd={cd} env={env} isWateredToday={isWateredToday} />
            {COTYLEDON_DROP.map((dropDay, i) => {
              const d = i === 0 ? COTYLEDON_L : COTYLEDON_R;
              if (cd < dropDay) {
                // 枝に付いたまま、だんだん垂れ下がる
                const droop = (i === 0 ? -1 : 1) * cotyledonAge * 28;
                return (
                  <path
                    key={i}
                    d={d}
                    transform={`translate(0 -20) rotate(${droop.toFixed(1)}) scale(${(1 - cotyledonAge * 0.15).toFixed(2)})`}
                    fill={cotyledonFill}
                    stroke={cotyledonStroke}
                    strokeWidth="0.6"
                  />
                );
              }
              if (cd - dropDay > 1) return null;
              const fall: CSSVars = { animationDuration: '8s', animationDelay: `${-i * 3}s`, '--drop': '22px', '--drift': i === 0 ? '-10px' : '10px' };
              const flip: CSSVars = { animationDuration: '1.9s', '--spin': '70deg' };
              return (
                <g key={i} transform="translate(0 -20)" className="fallers">
                  <g className="fall-flutter" style={fall}>
                    <g className="fall-flip" style={flip}>
                      <path d={d} transform={`translate(${i === 0 ? 9 : -9} 0)`} fill={cotyledonFill} stroke={cotyledonStroke} strokeWidth="0.6" />
                    </g>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      )}
    </g>
  );
}
