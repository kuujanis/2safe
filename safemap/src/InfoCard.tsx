import React from 'react';

interface SafetyCategory {
  score: number;
  mark: 'Low' | 'Medium' | 'High' | 'Very High';
}

interface PathCardProps {
  pathLength: number;
  pathTime: number;
  safetyCategory: SafetyCategory;
  dark?: boolean;
}

const safetyColors: Record<SafetyCategory['mark'], string> = {
  Low: '#af4c4cff', // green
  Medium: '#FF9800', // orange
  High: '#f0ff22ff', // orangered
  'Very High': '#36f43cff', // red
};

const formatLength = (meters: number) =>
  meters > 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;

const formatTime = (minutes: number) => `${minutes} min`;

export const InfoCard: React.FC<PathCardProps> = ({
  pathLength,
  pathTime,
  safetyCategory,
  dark,
}) => {
  const bgColor = dark ? '#000' : '#fff';
  const textColor = dark ? '#fff' : '#000';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: '90%',
        padding: 16,
        borderRadius: 8,
        margin: '4px 16px',
        boxShadow: dark
          ? '0 2px 6px rgba(255,255,255,0.15)'
          : '0 2px 6px rgba(0,0,0,0.15)',
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0' }}>Path Information</h3>

      <div style={{ marginBottom: 8 }}>
        <strong>Length: </strong>
        <span>{formatLength(pathLength)}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>Time: </strong>
        <span>{formatTime(pathTime)}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <strong>Safety: </strong>
        <span
          style={{
            marginLeft: 8,
            fontWeight: 'bold',
            color: safetyColors[safetyCategory.mark],
          }}
          title={`Safety score: ${safetyCategory.score}`}
        >
          {safetyCategory.mark} ({safetyCategory.score.toFixed(1)})
        </span>
      </div>
    </div>
  );
};
