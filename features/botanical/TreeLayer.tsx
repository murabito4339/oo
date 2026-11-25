'use client';

import { buildClusterPathByShape, buildTaperedBranchPath, computeTreeSkeleton, getAnchorPoint } from './treeGeometry';
import type { CanopyClusterSpec, EnvironmentState, LeafShape, SpeciesConfig, TreeSkeleton } from './types';
import { clamp, lerp, lerpColor, tintForTime } from './utils';

type Props = {
  days: number;
  species: SpeciesConfig;
  env: EnvironmentState;
  isWateredToday: boolean;
  treeBaseX: number;
};

function renderSingleLeaf(
  shape: LeafShape,
  len: number,
  w: number,
  fill: string,
  veinColor: string
) {
  if (shape === 'tropical') {
    const tLen = len * 1.35;
    const tW = w * 1.15;
    return (
      <>
        <path
          d={`M0 0 C ${tLen * 0.25} ${-tW}, ${tLen * 0.72} ${-tW * 0.85}, ${tLen} 0 C ${tLen * 0.72} ${tW * 0.85}, ${tLen * 0.25} ${tW}, 0 0 Z`}
          fill={fill}
        />
        <path
          d={`M1 0 L ${tLen * 0.85} 0`}
          stroke={veinColor}
          strokeOpacity="0.58"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (shape === 'maple') {
    const mLen = len * 1.12;
    const mW = w * 1.55;
    return (
      <>
        <path
          d={`M0 0 L ${mLen * 0.32} ${-mW * 0.85} L ${mLen * 0.44} ${-mW * 0.3} L ${mLen * 0.72} ${-mW * 0.7} L ${mLen * 0.65} ${-mW * 0.16} L ${mLen} 0 L ${mLen * 0.65} ${mW * 0.16} L ${mLen * 0.72} ${mW * 0.7} L ${mLen * 0.44} ${mW * 0.3} L ${mLen * 0.32} ${mW * 0.85} Z`}
          fill={fill}
        />
        <path
          d={`M1 0 L ${mLen * 0.78} 0`}
          stroke={veinColor}
          strokeOpacity="0.45"
          strokeWidth="0.55"
          strokeLinecap="round"
        />
      </>
    );
  }

  if (shape === 'needle') {
    const nLen = len * 1.18;
    return (
      <g stroke={fill} strokeWidth="1.45" strokeLinecap="round">
        <line x1="0" y1="0" x2={nLen} y2="0" />
        <line x1="0" y1="0" x2={nLen * 0.88} y2={-w * 0.85} />
        <line x1="0" y1="0" x2={nLen * 0.88} y2={w * 0.85} />
      </g>
    );
  }

  return (
    <>
      <path
        d={`M0 0 C ${len * 0.35} ${-w}, ${len * 0.8} ${-w * 0.75}, ${len} 0 C ${len * 0.8} ${w * 0.75}, ${len * 0.35} ${w}, 0 0 Z`}
        fill={fill}
      />
      <path
        d={`M1 0 L ${len * 0.75} 0`}
        stroke={veinColor}
        strokeOpacity="0.45"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
    </>
  );
}

export function TreeLayer({ days, species, env, isWateredToday, treeBaseX }: Props) {
  const cycle = days === 0 ? 1 : Math.floor((days - 1) / 360) + 1;
  const cd = days === 0 ? 0 : ((days - 1) % 360) + 1;

  const bark = species.getBarkPalette(cd, env);
  const oldTrunkDark = tintForTime('#4A433E', env.nightFactor, '#1E293B', 0.65);

  const isSproutPhase = days >= 1 && cd <= 23;
  const sproutG = clamp((cd - 1) / 22, 0, 1);
  const sproutH = lerp(8, 46, Math.pow(sproutG, 0.85));
  const sproutWave = Math.sin(sproutG * Math.PI * 2.1) * 4.5 * Math.sin(sproutG * Math.PI);
  const sproutHook = cd <= 10 ? lerp(8, 0, clamp((cd - 1) / 9, 0, 1)) : 0;

  const isSecondGen = cycle >= 2;
  const skel =
    !isSproutPhase && days >= 1
      ? computeTreeSkeleton(cd, species.branches, {
          heightScale: species.trunkHeightScale,
          thicknessScale: species.trunkThicknessScale,
          isSecondGenChild: isSecondGen,
          isEvergreen: species.isEvergreen,
        })
      : null;

  const oldTreeUpperFade = isSecondGen ? clamp(1 - (cd - 1) / 13, 0, 1) : 0;
  const oldSkel =
    isSecondGen && oldTreeUpperFade > 0.02
      ? computeTreeSkeleton(360, species.branches, {
          heightScale: species.trunkHeightScale,
          thicknessScale: species.trunkThicknessScale,
          isEvergreen: species.isEvergreen,
        })
      : null;
  const oldStumpOpacity = isSecondGen ? clamp(1 - (cd - 42) / 33, 0, 1) : 0;

  const { budStart, flowerStart, flowerWitherStart, flowerEnd, fruitStart, fruitEnd } =
    species.bloomSchedule;
  const isBudStage = cd >= budStart && cd < flowerStart;
  const budProgress = clamp((cd - budStart) / Math.max(1, flowerStart - budStart), 0, 1);
  const isFlowerStage = cd >= flowerStart && cd <= flowerEnd;
  const isBerryStage = cd >= fruitStart && cd <= fruitEnd;
  const berryMaturity = clamp((cd - fruitStart) / 45, 0, 1);

  const swayClass = !species.isEvergreen && cd >= 314 ? '' : 'mountain-tree-sway';
  const branchSnowOpacity = clamp(
    Math.max(env.snowLevel * 0.85, !species.isEvergreen && cd >= 306 ? clamp((cd - 306) / 22, 0, 0.92) : 0),
    0,
    0.92
  );

  function renderTrunkAndBranches(
    skeleton: TreeSkeleton,
    trunkFill: string,
    darkStroke: string,
    snowOpacity: number,
    upperWeatherRatio = 0
  ) {
    const wBase = 9.2 * skeleton.trunkScaleW;
    const wMid = 6.2 * skeleton.trunkScaleW;
    const wFork = 3.8 * skeleton.trunkScaleW;

    return (
      <g>
        <path
          d={`M ${-wBase * 2.1} 3.5 C ${-wBase * 1.2} 1, ${-wBase * 1.05} -12, ${-wBase * 0.9} -32
              C ${skeleton.p1.x - wMid} ${skeleton.p1.y}, ${skeleton.p2.x - wMid * 0.8} ${skeleton.p2.y}, ${skeleton.p3.x - wFork} ${skeleton.p3.y}
              L ${skeleton.pLeadCtrl.x - 2.2 * skeleton.trunkScaleW} ${skeleton.pLeadCtrl.y}
              L ${skeleton.pTip.x} ${skeleton.pTip.y}
              L ${skeleton.pLeadCtrl.x + 2.2 * skeleton.trunkScaleW} ${skeleton.pLeadCtrl.y}
              L ${skeleton.p3.x + wFork} ${skeleton.p3.y}
              C ${skeleton.p2.x + wMid * 0.8} ${skeleton.p2.y}, ${skeleton.p1.x + wMid} ${skeleton.p1.y}, ${wBase * 0.92} -32
              C ${wBase * 1.08} -12, ${wBase * 1.25} 1, ${wBase * 2.15} 3.5 Z`}
          fill={trunkFill}
        />

        <path
          d={`M -1.5 -10 Q ${skeleton.p1.x} ${skeleton.p1.y * 0.9}, ${skeleton.p2.x * 0.7} ${skeleton.p2.y * 0.88}`}
          stroke={darkStroke}
          strokeOpacity="0.38"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {species.branches.map((br) => {
          const cb = skeleton.branches[br.id];
          if (!cb) return null;
          const isUpper = br.trunkT >= 0.95;
          const op = isUpper ? clamp(1 - upperWeatherRatio * 1.25, 0, 1) : 1;
          if (op <= 0.04) return null;

          return (
            <g key={br.id} opacity={op}>
              <path
                d={buildTaperedBranchPath(
                  cb.start.x,
                  cb.start.y,
                  cb.ctrl.x,
                  cb.ctrl.y,
                  cb.end.x,
                  cb.end.y,
                  cb.w0,
                  cb.w1
                )}
                fill={trunkFill}
              />
              {cb.twigs.map((tw, idx) => (
                <line
                  key={`${br.id}-tw-${idx}`}
                  x1={tw.origin.x}
                  y1={tw.origin.y}
                  x2={tw.end.x}
                  y2={tw.end.y}
                  stroke={darkStroke}
                  strokeWidth={tw.w}
                  strokeLinecap="round"
                  opacity={1 - upperWeatherRatio * 0.85}
                />
              ))}
              {snowOpacity > 0.04 && (
                <path
                  d={`M ${(cb.start.x + (cb.end.x - cb.start.x) * 0.14).toFixed(1)} ${(
                    cb.start.y +
                    (cb.end.y - cb.start.y) * 0.14 -
                    cb.w0 * 0.55
                  ).toFixed(1)} Q ${cb.ctrl.x.toFixed(1)} ${(cb.ctrl.y - cb.w0 * 0.45).toFixed(1)}, ${(
                    cb.start.x +
                    (cb.end.x - cb.start.x) * 0.88
                  ).toFixed(1)} ${(cb.start.y + (cb.end.y - cb.start.y) * 0.88 - cb.w1 * 0.6).toFixed(1)}`}
                  stroke="#FFFFFF"
                  strokeWidth={Math.max(1.5, cb.w0 * 0.44)}
                  strokeLinecap="round"
                  opacity={snowOpacity * op}
                />
              )}
            </g>
          );
        })}
      </g>
    );
  }

  function renderClusterLayer(layer: CanopyClusterSpec['layer']) {
    if (!skel || cd < 28) return null;

    return species.clusters
      .filter((c) => c.layer === layer)
      .map((cluster) => {
        const growth = species.getClusterGrowth(cd, cluster, env);
        if (!growth.visible) return null;

        const pos = getAnchorPoint(
          skel,
          cluster.branchId,
          cluster.branchT,
          cluster.ox,
          cluster.oy,
          growth.grow
        );
        if (!pos) return null;

        const pal = species.getFoliagePalette(cd, cluster.toneOffset, env);
        const mainFill = layer === 'back' ? pal.back : layer === 'mid' ? pal.mid2 : pal.front1;
        const highlightFill = layer === 'mid' ? pal.mid1 : pal.front2;

        if (growth.fallingProgress !== null) {
          return (
            <g key={`${cluster.id}-falling`}>
              {cluster.leafAngles.slice(0, 2).map((deg, idx) => {
                const ft = clamp((growth.fallingProgress! - idx * 2.5) / 18, 0, 1);
                if (ft <= 0 || ft >= 1) return null;
                const dropDist = (6 - pos.y) * Math.pow(ft, 1.08);
                const lx = pos.x + Math.sin(ft * Math.PI * 2.6 + idx * 1.4) * 18 - ft * 14;
                const ly = pos.y + dropDist;
                const rot = deg + ft * 280 * (idx % 2 === 0 ? 1 : -1);
                const op = ft > 0.84 ? (1 - ft) / 0.16 : 0.92;
                return (
                  <g
                    key={`${cluster.id}-fall-lf-${idx}`}
                    transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) rotate(${rot.toFixed(0)})`}
                    opacity={op}
                  >
                    {renderSingleLeaf(
                      species.leafShape,
                      10,
                      3.8,
                      idx === 0 ? pal.mid1 : pal.front1,
                      pal.vein
                    )}
                  </g>
                );
              })}
            </g>
          );
        }

        const r = cluster.r * growth.grow * (1 - growth.shrink);

        return (
          <g
            key={cluster.id}
            transform={`translate(0, ${growth.droop.toFixed(1)})`}
            opacity={growth.opacity}
          >
            <path
              d={buildClusterPathByShape(species.leafShape, pos.x, pos.y, r, growth.fold * 0.55)}
              fill={mainFill}
            />
            {layer !== 'back' && (
              <path
                d={buildClusterPathByShape(
                  species.leafShape,
                  pos.x + r * 0.1,
                  pos.y - r * 0.12,
                  r * 0.72,
                  growth.fold * 0.5
                )}
                fill={highlightFill}
                opacity="0.82"
              />
            )}
            {species.leafShape === 'needle' && env.snowLevel > 0.25 && layer !== 'back' && (
              <path
                d={`M ${(pos.x - r * 0.52).toFixed(1)} ${(pos.y - r * 0.34).toFixed(1)} L ${pos.x.toFixed(1)} ${(pos.y - r * 0.88).toFixed(1)} L ${(pos.x + r * 0.52).toFixed(1)} ${(pos.y - r * 0.34).toFixed(1)} Q ${pos.x.toFixed(1)} ${(pos.y - r * 0.45).toFixed(1)}, ${(pos.x - r * 0.52).toFixed(1)} ${(pos.y - r * 0.34).toFixed(1)} Z`}
                fill={tintForTime('#FFFFFF', env.nightFactor, '#94A3B8', 0.5)}
                opacity={env.snowLevel * 0.62}
              />
            )}
            {cluster.leafAngles.map((deg, idx) => {
              const rad = (deg * Math.PI) / 180;
              const droopAngle =
                deg + (deg > 90 && deg < 270 ? -1 : 1) * (growth.droop / 5.5) * 34;
              const foldAngle = droopAngle - growth.fold * 28;
              const lx = pos.x + Math.cos(rad) * (r * (0.76 - growth.fold * 0.2));
              const ly = pos.y + Math.sin(rad) * (r * (0.64 - growth.fold * 0.15));
              const leafLen = (9 + (idx % 2) * 3) * (0.55 + 0.45 * growth.grow);
              const leafW = 4.2 * (1 - growth.shrink * 1.2);

              return (
                <g
                  key={`${cluster.id}-lf-${idx}`}
                  transform={`translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) rotate(${foldAngle.toFixed(1)})`}
                >
                  {renderSingleLeaf(
                    species.leafShape,
                    leafLen,
                    leafW,
                    layer === 'back' ? pal.back : pal.front1,
                    pal.vein
                  )}
                  {isWateredToday && layer === 'front' && env.snowLevel < 0.5 && idx === 0 && (
                    <circle cx={leafLen * 0.78} cy="1.2" r="1.1" fill="#E0F2FE" opacity="0.9" />
                  )}
                </g>
              );
            })}
          </g>
        );
      });
  }

  function renderFlower(open: number, wither: number) {
    if (species.flowerStyle === 'hibiscus') {
      const petalOuter = tintForTime('#F43F5E', env.nightFactor, '#4C1D3D', 0.6);
      const petalInner = tintForTime('#FB7185', env.nightFactor, '#6E2B4D', 0.55);
      const throat = tintForTime('#9F1239', env.nightFactor, '#311022', 0.65);
      const stamen = tintForTime('#FDE047', env.nightFactor, '#64748B', 0.55);
      return (
        <>
          {[0, 72, 144, 216, 288].map((deg) => (
            <g key={deg} transform={`rotate(${deg + wither * 8}) translate(0, ${-2.0 * open})`}>
              <path
                d="M0 1 C-5.5 -2.5, -6.8 -10.5, -1.8 -12.6 Q0 -11.4, 1.8 -12.6 C6.8 -10.5, 5.5 -2.5, 0 1 Z"
                fill={deg % 144 === 0 ? petalOuter : petalInner}
                stroke="#FDA4AF"
                strokeOpacity="0.35"
                strokeWidth="0.35"
              />
            </g>
          ))}
          <circle cx="0" cy="0" r="3.4" fill={throat} />
          <line x1="0" y1="0" x2="0" y2={-9.2 * open} stroke={stamen} strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="-1.1" cy={-8.4 * open} r="0.9" fill={stamen} />
          <circle cx="1.1" cy={-8.8 * open} r="0.9" fill={stamen} />
          <circle cx="0" cy={-9.8 * open} r="1.0" fill={tintForTime('#F97316', env.nightFactor, '#475569', 0.6)} />
        </>
      );
    }

    if (species.flowerStyle === 'camellia') {
      const outerFill = tintForTime('#DC2626', env.nightFactor, '#45121B', 0.62);
      const innerFill = tintForTime('#EF4444', env.nightFactor, '#5E1E2B', 0.58);
      const stamen = tintForTime('#FACC15', env.nightFactor, '#64748B', 0.58);
      return (
        <>
          {[0, 72, 144, 216, 288].map((deg) => (
            <g key={`co-${deg}`} transform={`rotate(${deg}) translate(0, ${-2.2 * open})`}>
              <path
                d="M0 1 C-4.8 -2, -5.2 -8.6, 0 -9.8 C5.2 -8.6, 4.8 -2, 0 1 Z"
                fill={outerFill}
              />
            </g>
          ))}
          {[36, 108, 180, 252, 324].map((deg) => (
            <g key={`ci-${deg}`} transform={`rotate(${deg}) translate(0, ${-1.4 * open})`}>
              <path
                d="M0 0.8 C-3.6 -1.5, -3.8 -6.4, 0 -7.2 C3.8 -6.4, 3.6 -1.5, 0 0.8 Z"
                fill={innerFill}
              />
            </g>
          ))}
          <circle cx="0" cy="0" r="2.8" fill={stamen} />
          <circle cx="0" cy="0" r="1.2" fill={tintForTime('#CA8A04', env.nightFactor, '#334155', 0.6)} />
        </>
      );
    }

    if (species.flowerStyle === 'mapleBlossom') {
      const pFill = tintForTime('#FDBA74', env.nightFactor, '#5B3D32', 0.6);
      const core = tintForTime('#DC2626', env.nightFactor, '#451A1A', 0.65);
      return (
        <>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <g key={deg} transform={`rotate(${deg}) translate(0, ${-1.8 * open})`}>
              <path d="M0 0.8 C-2.4 -1.6, -2.2 -5.8, 0 -6.8 C2.2 -5.8, 2.4 -1.6, 0 0.8 Z" fill={pFill} />
            </g>
          ))}
          <circle cx="0" cy="0" r="2.1" fill={core} />
        </>
      );
    }

    return (
      <>
        {[0, 72, 144, 216, 288].map((deg) => (
          <g key={deg} transform={`rotate(${deg + wither * 10}) translate(0, ${-2.4 * open})`}>
            <path
              d="M0 1.2 C-4.2 -2.8, -4.8 -9.5, -1.2 -11.2 L0 -9.6 L1.2 -11.2 C4.8 -9.5, 4.2 -2.8, 0 1.2 Z"
              fill="url(#petalOuter)"
              stroke="#F9A8D4"
              strokeOpacity="0.45"
              strokeWidth="0.4"
            />
          </g>
        ))}
        <circle cx="0" cy="0" r="2.6" fill={tintForTime('#FDE047', env.nightFactor, '#64748B', 0.6)} />
        <circle cx="0" cy="0" r="1.1" fill={tintForTime('#CA8A04', env.nightFactor, '#334155', 0.65)} />
      </>
    );
  }

  function renderFruit() {
    if (species.fruitStyle === 'acorn') {
      return (
        <>
          <line x1="0" y1="0" x2="0" y2="3.5" stroke={tintForTime('#78350F', env.nightFactor, '#1E293B', 0.7)} strokeWidth="0.8" />
          <ellipse
            cx="0"
            cy="6.5"
            rx={lerp(1.8, 2.6, berryMaturity)}
            ry={lerp(2.2, 3.3, berryMaturity)}
            fill={tintForTime(lerpColor('#84CC16', '#B45309', berryMaturity), env.nightFactor, '#332924', 0.65)}
          />
          <path
            d="M -2.7 4.4 Q 0 2.6 2.7 4.4 Z"
            fill={tintForTime('#451A03', env.nightFactor, '#1E293B', 0.7)}
          />
        </>
      );
    }

    const immature = species.fruitStyle === 'hibiscusPod' ? '#16A34A' : '#65A30D';
    const mature =
      species.fruitStyle === 'hibiscusPod'
        ? '#CA8A04'
        : species.fruitStyle === 'camelliaNut'
          ? '#9A3412'
          : '#DC2626';

    return (
      <>
        <line x1="0" y1="0" x2="0" y2="4" stroke={tintForTime('#78350F', env.nightFactor, '#1E293B', 0.7)} strokeWidth="0.8" />
        <circle
          cx="0"
          cy="5.5"
          r={lerp(2.0, 3.1, berryMaturity)}
          fill={tintForTime(lerpColor(immature, mature, berryMaturity), env.nightFactor, '#3B425E', 0.65)}
        />
        <circle cx="-0.8" cy="4.6" r="0.7" fill="#FFFFFF" opacity={env.nightFactor > 0.5 ? 0.35 : 0.5} />
      </>
    );
  }

  const budReadyColor =
    species.flowerStyle === 'hibiscus'
      ? '#FB7185'
      : species.flowerStyle === 'camellia'
        ? '#EF4444'
        : species.flowerStyle === 'mapleBlossom'
          ? '#FDBA74'
          : '#FBCFE8';

  return (
    <g>
      {isSecondGen && oldSkel && (
        <g transform="translate(256, 253)" opacity={oldTreeUpperFade * 0.68}>
          {renderTrunkAndBranches(
            oldSkel,
            'url(#oldTrunkGrad)',
            oldTrunkDark,
            lerp(0.75, 0, clamp(cd / 10, 0, 1)),
            clamp((cd - 1) / 10, 0, 1)
          )}
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

      {isSproutPhase && (
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
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

      {days >= 1 && !isSproutPhase && skel && (
        <g transform={`translate(${treeBaseX.toFixed(1)}, 253)`}>
          <g className={swayClass}>
            <g className={cd < 305 || species.isEvergreen ? 'canopy-breath' : undefined}>
              {renderClusterLayer('back')}
            </g>

            {renderTrunkAndBranches(skel, 'url(#trunkGrad)', bark.dark, branchSnowOpacity)}

            <g className={cd < 305 || species.isEvergreen ? 'canopy-breath' : undefined}>
              {renderClusterLayer('mid')}
              {renderClusterLayer('front')}
            </g>

            {isBudStage &&
              species.blossoms.map((node) => {
                const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                if (!pos) return null;
                const localProgress = clamp(budProgress * 1.15 - (node.dayOffset + 2) * 0.04, 0.15, 1);
                return (
                  <g
                    key={`bud-${node.id}`}
                    transform={`translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) rotate(${node.rot}) scale(${(
                      node.scale *
                      (0.35 + localProgress * 0.65)
                    ).toFixed(2)})`}
                  >
                    <path
                      d="M0 0 C-3.8 -3.5, -3.5 -9, 0 -11.5 C3.5 -9, 3.8 -3.5, 0 0 Z"
                      fill={tintForTime(
                        localProgress > 0.55 ? budReadyColor : '#DCFCE7',
                        env.nightFactor,
                        '#475569',
                        0.55
                      )}
                      stroke={budReadyColor}
                      strokeOpacity="0.45"
                      strokeWidth="0.5"
                    />
                    <path d="M-2.8 0 Q0 2.5 2.8 0 L0 -2 Z" fill="#15803D" />
                  </g>
                );
              })}

            {isFlowerStage &&
              species.blossoms.map((node) => {
                const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                if (!pos) return null;
                const startDay = flowerStart + node.dayOffset;
                if (cd < startDay) return null;
                const open = clamp((cd - startDay) / 6, 0.25, 1);
                const wither =
                  cd > flowerWitherStart + node.dayOffset
                    ? clamp((cd - (flowerWitherStart + node.dayOffset)) / 20, 0, 1)
                    : 0;
                const op = 1 - wither * 0.9;
                if (op <= 0.05) return null;

                return (
                  <g
                    key={`fl-${node.id}`}
                    transform={`translate(${pos.x.toFixed(1)}, ${(pos.y + wither * 3).toFixed(1)}) rotate(${
                      node.rot + wither * 12
                    }) scale(${(node.scale * (0.55 + open * 0.48)).toFixed(2)})`}
                    opacity={op}
                  >
                    {renderFlower(open, wither)}
                  </g>
                );
              })}

            {isBerryStage &&
              species.blossoms
                .filter((n) => n.hasBerry)
                .map((node) => {
                  const pos = getAnchorPoint(skel, node.branchId, node.branchT, node.ox, node.oy);
                  if (!pos) return null;
                  return (
                    <g key={`berry-${node.id}`} transform={`translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`}>
                      {renderFruit()}
                    </g>
                  );
                })}
          </g>
        </g>
      )}

      {!species.isEvergreen && cd >= 325 && (
        <g>
          <path d="M234 259 L246 256 M241 257 L245 253" stroke="#574C43" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="268" cy="254" rx="2.8" ry="1.8" fill="#78350F" />
          <ellipse cx="248" cy="255" rx="2.0" ry="1.3" fill="#451A03" />
        </g>
      )}
    </g>
  );
}
