type Props = {
  size?: number;
  mood?: 'happy' | 'cheer' | 'sleepy';
  className?: string;
};

/**
 * アプリのマスコット「めばえ」。植物コンサバトリーと世界観をそろえた、鉢植えの双葉。
 */
export function Sprout({ size = 72, mood = 'happy', className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
    >
      {/* 影 */}
      <ellipse cx="40" cy="75" rx="20" ry="3.5" fill="#000" opacity="0.08" />
      {/* 茎 */}
      <path d="M40 44 C40 36 40 30 40 24" stroke="#43a012" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* 葉（左） */}
      <path
        d="M39 28 C30 30 20 25 17 14 C28 11 37 16 39 28 Z"
        fill="#58c322"
        stroke="#43a012"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M37 26 C31 23 25 19 21 15" stroke="#43a012" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* 葉（右） */}
      <path
        d="M41 26 C47 15 57 11 66 15 C63 27 52 31 41 26 Z"
        fill="#7ad94a"
        stroke="#43a012"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {mood === 'cheer' && (
        <g fill="#ffb020">
          <circle cx="12" cy="30" r="2" />
          <circle cx="70" cy="30" r="2" />
          <path d="M66 6 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z" />
        </g>
      )}
      {/* 鉢 */}
      <path d="M20 42 H60 L55 72 H25 Z" fill="#ff8a5b" stroke="#d9603a" strokeWidth="2" strokeLinejoin="round" />
      <rect x="17" y="38" width="46" height="9" rx="4" fill="#ff9f78" stroke="#d9603a" strokeWidth="2" />
      {/* 顔 */}
      {mood === 'sleepy' ? (
        <g stroke="#3c4a57" strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M31 57 q3 2 6 0" />
          <path d="M43 57 q3 2 6 0" />
        </g>
      ) : (
        <g fill="#3c4a57">
          <ellipse cx="33" cy="56" rx="2.6" ry="3.2" />
          <ellipse cx="47" cy="56" rx="2.6" ry="3.2" />
          <circle cx="34" cy="55" r="0.9" fill="#fff" />
          <circle cx="48" cy="55" r="0.9" fill="#fff" />
        </g>
      )}
      <path
        d={mood === 'cheer' ? 'M35 62 q5 6 10 0 Z' : 'M36 62 q4 3.5 8 0'}
        stroke="#3c4a57"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mood === 'cheer' ? '#3c4a57' : 'none'}
      />
      <ellipse cx="28" cy="61" rx="3" ry="1.8" fill="#ff5a5f" opacity="0.35" />
      <ellipse cx="52" cy="61" rx="3" ry="1.8" fill="#ff5a5f" opacity="0.35" />
    </svg>
  );
}
