'use client';

import { BotanicalTree } from './botanicalTree/BotanicalTree';
import type { EnvironmentState, SpeciesConfig } from './types';
import { clamp, lerp, tintForTime } from './utils';

type Props = {
  days: number;
  species: SpeciesConfig;
  env: EnvironmentState;
  isWateredToday: boolean;
  treeBaseX: number;
};

/** 前のサイクルの木が立っていた位置（2代目以降の treeBaseX は cd360 で 260 に戻る） */
const PREVIOUS_TREE_X = 260;

export function TreeLayer({ days, species, env, isWateredToday, treeBaseX }: Props) {
  const cycle = days === 0 ? 1 : Math.floor((days - 1) / 360) + 1;
  const cd = days === 0 ? 0 : ((days - 1) % 360) + 1;
  const isSecondGen = cycle >= 2;

  // 芽（cd1〜23）から木（cd24〜）へは 10 日かけてクロスフェードする
  const isSproutVisible = days >= 1 && cd <= 33;
  const sproutOpacity = cd <= 23 ? 1 : clamp(1 - (cd - 23) / 10, 0, 1);
  const treeOpacity = clamp((cd - 23) / 8, 0, 1);

  const sproutG = clamp((cd - 1) / 22, 0, 1);
  const sproutH = lerp(8, 46, Math.pow(sproutG, 0.85));
  const sproutWave = Math.sin(sproutG * Math.PI * 2.1) * 4.5 * Math.sin(sproutG * Math.PI);
  const sproutHook = cd <= 10 ? lerp(8, 0, clamp((cd - 1) / 9, 0, 1)) : 0;
  const swayClass = 'mountain-tree-sway';

  // 前の世代の木：位置を変えずに、葉も含めて 2 週間かけて薄れていく
  const oldTreeOpacity = isSecondGen ? clamp(1 - (cd - 1) / 13, 0, 1) * 0.92 : 0;
  const oldStumpOpacity = isSecondGen ? clamp(1 - (cd - 42) / 33, 0, 1) : 0;

  return (
    <g>
      {oldTreeOpacity > 0.02 && (
        <g transform={`translate(${PREVIOUS_TREE_X}, 253)`} opacity={oldTreeOpacity}>
          <BotanicalTree species={species} cd={360} env={env} isWateredToday={false} animate={false} />
        </g>
      )}

      {isSecondGen && oldStumpOpacity > 0.02 && (
        <g transform="translate(255, 253)" opacity={oldStumpOpacity}>
          <path
            d="M -14 3 C -8.5 0.5, -7 -7, -6 -17 L -2 -19 L 2 -15.5 L 5.8 -18 C 7 -7.5, 8.5 0.5, 13.5 3 Z"
            fill="url(#oldTrunkGrad)"
          />
          <path
            d="M -2 -3 Q -3 -9.5 -1 -15 M 2 -2 Q 3 -8.5 2 -14"
            stroke="#3F3934"
            strokeWidth="0.9"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
          {cd >= 4 && (
            <g
              fill={tintForTime('#65A30D', env.nightFactor, '#1E3A5F', 0.62)}
              opacity={clamp((cd - 4) / 14, 0.25, 0.85)}
            >
              <ellipse cx="-5" cy="-6.5" rx="3.2" ry="4.4" />
              <ellipse cx="4.2" cy="-4.8" rx="2.6" ry="3.6" />
              <ellipse
                cx="-1.5"
                cy="-15.5"
                rx="2.5"
                ry="1.7"
                fill={tintForTime('#84CC16', env.nightFactor, '#335275', 0.6)}
              />
            </g>
          )}
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

      {isSproutVisible && (
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`} opacity={sproutOpacity}>
          <g className={swayClass}>
            <path
              d={`M -1.6 0 Q ${(-2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, ${(
                (isSecondGen ? 4 : 0) + sproutHook * 0.5
              ).toFixed(1)} ${(-sproutH).toFixed(1)}
              L ${((isSecondGen ? 4 : 0) + 1.4 + sproutHook * 0.5).toFixed(1)} ${(-sproutH).toFixed(1)}
              Q ${(1.2 + sproutWave).toFixed(1)} ${(-sproutH * 0.5).toFixed(1)}, 1.6 0 Z`}
              fill={tintForTime(species.sproutColors.stem, env.nightFactor, '#1E3A5F', 0.62)}
            />
            <g
              transform={`translate(${((isSecondGen ? 2 : 0) + sproutWave * 0.5).toFixed(1)}, ${(
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
                transform={`translate(${((isSecondGen ? 4 : 0) + sproutHook * 0.5).toFixed(1)}, ${(
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
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`} opacity={treeOpacity}>
          <g className={swayClass}>
            <BotanicalTree species={species} cd={cd} env={env} isWateredToday={isWateredToday} />
          </g>
        </g>
      )}
    </g>
  );
}
