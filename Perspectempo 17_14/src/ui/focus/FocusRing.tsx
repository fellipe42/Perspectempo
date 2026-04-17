// =====================================================================
// FocusRing — representação visual do tempo da atividade.
//
// ARQUITETURA:
//   - SVG: apenas o anel e arcos. Sem texto, sem foreignObject.
//   - HTML overlay absoluto para o conteúdo central, com padding
//     interno calculado para caber dentro do anel interno (zona segura).
//   - Eliminando foreignObject, tipografia respira e não sofre clipping.
//
// ZONA SEGURA DO CENTRO:
//   - Anel interno está em r=34 (viewBox 100).
//   - Cronômetros são naturalmente retangulares (mais largos que altos).
//   - Usamos retângulo seguro: width=55% × height=35% do size.
//     (width/2)² + (height/2)² = 27.5² + 17.5² = 1062 ≤ r²=1156 ✓
//   - Para size=320 isso dá 176×112px — confortável para HH:MM:SS + nome.
//   - Para size=560 (Modo Foco) dá 308×196px — espaço generoso.
//
// PORTABILIDADE PARA WEARABLE:
//   - Toda matemática continua em viewBox 100, independente de size.
//   - Para RN basta trocar <svg> por react-native-svg e o overlay
//     HTML por um <View absoluto>. API dos props inalterada.
// =====================================================================

import { CSSProperties, ReactNode } from 'react';

interface FocusRingProps {
  color: string;
  spentMinutes: number;
  goalMinutes: number;
  awakeMinutes: number;
  sessionSeconds?: number;
  size?: number;
  children?: ReactNode;
  pulsing?: boolean;
}

const V = 100;
const CX = 50;
const CY = 50;

// Geometria dos anéis, em unidades do viewBox.
const R_MAIN = 42;
const R_OVER = 46;
const R_INNER = 34;
const SW_MAIN = 2.6;
const SW_OVER = 1.4;
const SW_INNER = 0.9;

// Zona segura interna — retângulo inscrito no anel interno, com margem.
const SAFE_W_FRAC = 0.55;
const SAFE_H_FRAC = 0.35;

export function FocusRing({
  color,
  spentMinutes,
  goalMinutes,
  awakeMinutes,
  sessionSeconds = 0,
  size = 320,
  children,
  pulsing = false,
}: FocusRingProps) {
  const hasGoal = goalMinutes > 0;

  let mainFrac = 0;
  let overFrac = 0;
  if (hasGoal) {
    mainFrac = Math.min(1, spentMinutes / goalMinutes);
    const over = Math.max(0, spentMinutes - goalMinutes);
    overFrac = Math.min(1, over / goalMinutes);
  } else {
    // Sem meta: sessão atual com referência de 1h.
    mainFrac = Math.min(1, sessionSeconds / (60 * 60));
  }

  const innerFrac = awakeMinutes > 0
    ? Math.min(1, spentMinutes / awakeMinutes)
    : 0;

  // Área central segura — retângulo horizontal centralizado.
  const safeW = Math.round(size * SAFE_W_FRAC);
  const safeH = Math.round(size * SAFE_H_FRAC);
  const safeStyle: CSSProperties = {
    position: 'absolute',
    top: Math.round((size - safeH) / 2),
    left: Math.round((size - safeW) / 2),
    width: safeW,
    height: safeH,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: 1,
    pointerEvents: 'none',
  };

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Progresso da atividade"
    >
      <svg
        viewBox={`0 0 ${V} ${V}`}
        width={size}
        height={size}
        className="block"
        style={{ overflow: 'visible' }}
      >
        {/* Track principal */}
        <circle
          cx={CX} cy={CY} r={R_MAIN}
          fill="none" stroke="#1f232c" strokeWidth={SW_MAIN}
        />

        {/* Ticks fantasmas quando não há meta */}
        {!hasGoal && <TickMarks r={R_MAIN} />}

        {/* Progresso principal */}
        <Arc
          r={R_MAIN} fraction={mainFrac}
          stroke={color} strokeWidth={SW_MAIN} rounded
        />

        {/* Excedente, em arco externo na mesma cor porém mais intensa */}
        {overFrac > 0 && (
          <Arc
            r={R_OVER} fraction={overFrac}
            stroke={lighten(color)} strokeWidth={SW_OVER}
            rounded opacity={0.9}
          />
        )}

        {/* Anel interno: fração do dia acordado */}
        <circle
          cx={CX} cy={CY} r={R_INNER}
          fill="none" stroke="#1f232c" strokeWidth={SW_INNER} opacity={0.8}
        />
        <Arc
          r={R_INNER} fraction={innerFrac}
          stroke="#6a7080" strokeWidth={SW_INNER} opacity={0.7}
        />

        {/* Pulso discreto — respira a cada 4s */}
        {pulsing && (
          <circle
            cx={CX} cy={CY} r={R_MAIN}
            fill="none" stroke={color} strokeWidth={SW_MAIN * 0.5}
            opacity={0.25}
          >
            <animate
              attributeName="r"
              values={`${R_MAIN};${R_MAIN + 1};${R_MAIN}`}
              dur="4s" repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.25;0.05;0.25"
              dur="4s" repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>

      {/* Zona segura central, HTML, sem clipping */}
      {children && <div style={safeStyle}>{children}</div>}
    </div>
  );
}

// --------------------------------------------------------------------
// Arc — arco a partir do topo, sentido horário.
// --------------------------------------------------------------------
function Arc({
  r, fraction, stroke, strokeWidth, rounded = false, opacity = 1,
}: {
  r: number; fraction: number;
  stroke: string; strokeWidth: number;
  rounded?: boolean; opacity?: number;
}) {
  const C = 2 * Math.PI * r;
  const dash = C * Math.min(1, Math.max(0, fraction));
  const gap  = C - dash;
  return (
    <circle
      cx={CX} cy={CY} r={r}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={`${dash} ${gap}`}
      strokeLinecap={rounded ? 'round' : 'butt'}
      transform={`rotate(-90 ${CX} ${CY})`}
      opacity={opacity}
      style={{ transition: 'stroke-dasharray 400ms ease-out' }}
    />
  );
}

function TickMarks({ r }: { r: number }) {
  const ticks = [
    { frac: 25 / 60, opacity: 0.22 },
    { frac: 50 / 60, opacity: 0.16 },
  ];
  return (
    <g>
      {ticks.map((t, i) => {
        const angle = -Math.PI / 2 + t.frac * Math.PI * 2;
        const x1 = CX + Math.cos(angle) * (r - 1.3);
        const y1 = CY + Math.sin(angle) * (r - 1.3);
        const x2 = CX + Math.cos(angle) * (r + 1.3);
        const y2 = CY + Math.sin(angle) * (r + 1.3);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#8a8f99" strokeWidth={0.4}
            opacity={t.opacity}
          />
        );
      })}
    </g>
  );
}

// Clareia um hex em ~15% — usado para o tom de transbordamento.
function lighten(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.22));
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
}
