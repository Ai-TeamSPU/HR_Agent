'use client';

interface MatchScoreRadialProps {
  score: number;
  size?: number;
  label?: string;
  showPercentage?: boolean;
}

export function MatchScoreRadial({ score, size = 80, label, showPercentage = true }: MatchScoreRadialProps) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#059669', bg: '#ecfdf5', text: 'text-emerald-700' };
    if (s >= 65) return { stroke: '#d97706', bg: '#fffbeb', text: 'text-amber-700' };
    return { stroke: '#e11d48', bg: '#fff1f2', text: 'text-rose-700' };
  };

  const color = getColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={4}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${color.text}`}>{score}%</span>
          </div>
        )}
      </div>
      {label && <span className="text-[10px] text-slate-500 font-semibold">{label}</span>}
    </div>
  );
}
