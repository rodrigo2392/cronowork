import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export default function SprintBurndownChart({ sprint, onClose }) {
  const { activeProject } = useBoard();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!activeProject || !sprint) return null;

  // Sprint Date Range Calculation
  const start = sprint.startDate ? new Date(sprint.startDate) : new Date();
  const end = sprint.endDate ? new Date(sprint.endDate) : new Date();
  
  // Calculate duration in days
  const timeDiff = Math.max(0, end.getTime() - start.getTime());
  const sprintDaysCount = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // List dates of the sprint
  const dateList = [];
  for (let i = 0; i <= sprintDaysCount; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dateList.push(d.toISOString().split('T')[0]);
  }

  // Get burndown history
  const history = sprint.burndownHistory || [];
  const initialSP = history.length > 0 ? history[0].remainingSP : 0;
  
  // Map real burndown values for each date
  let lastKnownSP = initialSP;
  const realPoints = dateList.map((dateStr, idx) => {
    // Find if we have a recorded snapshot for this date
    const snapshot = history.find(h => h.date === dateStr);
    if (snapshot) {
      lastKnownSP = snapshot.remainingSP;
      return { dayIndex: idx, date: dateStr, sp: lastKnownSP, recorded: true };
    }
    
    // For future dates, do not render points.
    // If it's a past/present date with no snapshot, we fallback to the last known SP
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateStr > todayStr && sprint.status !== 'completed') {
      return null;
    }
    return { dayIndex: idx, date: dateStr, sp: lastKnownSP, recorded: false };
  }).filter(Boolean);

  // SVG dimensions
  const width = 500;
  const height = 300;
  const paddingX = 40;
  const paddingY = 30;

  // Scale calculations
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  
  const getX = (idx) => paddingX + (idx / sprintDaysCount) * chartWidth;
  const getY = (spValue) => {
    if (initialSP === 0) return paddingY + chartHeight;
    return paddingY + chartHeight - (spValue / initialSP) * chartHeight;
  };

  // Build ideal path points
  const idealStart = { x: getX(0), y: getY(initialSP) };
  const idealEnd = { x: getX(sprintDaysCount), y: getY(0) };

  // Build real path string
  let realPathStr = '';
  if (realPoints.length > 0) {
    realPathStr = `M ${getX(realPoints[0].dayIndex)} ${getY(realPoints[0].sp)}`;
    for (let i = 1; i < realPoints.length; i++) {
      realPathStr += ` L ${getX(realPoints[i].dayIndex)} ${getY(realPoints[i].sp)}`;
    }
  }

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
          }}
        />

        {/* Chart Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          style={{
            position: 'relative',
            width: '90%',
            maxWidth: '560px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 151,
            padding: '24px',
            color: 'var(--text-primary)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={20} style={{ color: 'var(--accent-color)' }} />
              Burndown Chart: {sprint.name}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Goal Display */}
          {sprint.goal && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px', background: 'rgba(255,255,255,0.01)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid var(--accent-color)' }}>
              <strong>Meta:</strong> "{sprint.goal}"
            </p>
          )}

          {initialSP === 0 ? (
            <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
              <AlertCircle size={32} />
              <p style={{ fontSize: '0.85rem' }}>No hay puntos de historia estimulados en este sprint todavía.</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              
              {/* SVG Chart */}
              <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="realLineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* X and Y Axes Grid Lines */}
                <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="var(--border-color)" strokeWidth={1} opacity={0.6} />
                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--border-color)" strokeWidth={1} opacity={0.6} />

                {/* Ideal Burndown Line (dashed red/gray) */}
                <line
                  x1={idealStart.x}
                  y1={idealStart.y}
                  x2={idealEnd.x}
                  y2={idealEnd.y}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  opacity={0.7}
                />

                {/* Real Burndown Area & Line */}
                {realPoints.length > 0 && (
                  <>
                    {/* Area under line */}
                    <path
                      d={`${realPathStr} L ${getX(realPoints[realPoints.length - 1].dayIndex)} ${height - paddingY} L ${getX(realPoints[0].dayIndex)} ${height - paddingY} Z`}
                      fill="url(#realLineGrad)"
                    />
                    {/* Line itself */}
                    <path
                      d={realPathStr}
                      fill="none"
                      stroke="var(--accent-color)"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Reference point dots */}
                {realPoints.map((point) => (
                  <circle
                    key={point.date}
                    cx={getX(point.dayIndex)}
                    cy={getY(point.sp)}
                    r={hoveredPoint?.date === point.date ? 6 : 4}
                    fill={point.recorded ? 'var(--accent-color)' : 'rgba(99, 102, 241, 0.4)'}
                    stroke="var(--bg-secondary)"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                ))}

                {/* Axis Labels */}
                <text x={paddingX - 10} y={paddingY + 4} fill="var(--text-muted)" fontSize={10} textAnchor="end">{initialSP} SP</text>
                <text x={paddingX - 10} y={height - paddingY + 4} fill="var(--text-muted)" fontSize={10} textAnchor="end">0 SP</text>

                <text x={paddingX} y={height - paddingY + 16} fill="var(--text-muted)" fontSize={10} textAnchor="middle">Inicio</text>
                <text x={width - paddingX} y={height - paddingY + 16} fill="var(--text-muted)" fontSize={10} textAnchor="middle">Fin</text>
              </svg>

              {/* Tooltip Overlay */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                minWidth: '120px',
                boxShadow: 'var(--shadow-md)',
                pointerEvents: 'none'
              }}>
                {hoveredPoint ? (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {new Date(hoveredPoint.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Restantes:</span>
                      <strong style={{ color: 'var(--accent-color)' }}>{hoveredPoint.sp} SP</strong>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    <span>Pasa el cursor sobre los puntos</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '2px', backgroundColor: '#94a3b8', borderStyle: 'dashed', borderWeight: '1px' }} />
              <span>Progreso Ideal</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '3px', backgroundColor: 'var(--accent-color)', borderRadius: '9px' }} />
              <span>Progreso Real</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
