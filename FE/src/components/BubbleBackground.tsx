import React from 'react';

const bubbleColors = [
  '#bae6fd', // xanh blue-200
  '#7dd3fc', // xanh blue-300
  '#a5b4fc', // tím indigo-300
  '#93c5fd', // xanh sky-300
  '#c7d2fe', // tím indigo-200
  '#a7f3d0', // xanh teal-200
  '#f0abfc', // tím hồng fuchsia-300
];

const bubbles = Array.from({ length: 22 });

const BubbleBackground: React.FC = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    {bubbles.map((_, i) => {
      const size = 54 + Math.random() * 90;
      const color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
      const highlightSize = size * (0.22 + Math.random() * 0.13);
      return (
        <span
          key={i}
          className="absolute rounded-full animate-bubble"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${size}px`,
            height: `${size}px`,
            bottom: `-${Math.random() * 200}px`,
            opacity: 0.28 + Math.random() * 0.18,
            background: `radial-gradient(circle at 65% 35%, #fff8 0%, ${color} 60%, #fff0 100%)`,
            border: '1.5px solid #fff7',
            boxShadow: '0 0 32px 8px #fff5, 0 0 0 1px #fff3',
            filter: 'blur(1.2px)',
            animationDelay: `${Math.random() * 7}s`,
            animationDuration: `${8 + Math.random() * 10}s`,
            transition: 'transform 0.3s',
          }}
        >
          {/* highlight ánh sáng */}
          <span
            style={{
              position: 'absolute',
              top: `${size * 0.18}px`,
              left: `${size * 0.22}px`,
              width: `${highlightSize}px`,
              height: `${highlightSize * 0.7}px`,
              background: 'radial-gradient(circle, #fff 0%, #fff7 80%, #fff0 100%)',
              borderRadius: '50%',
              opacity: 0.7,
              filter: 'blur(1.5px)',
              pointerEvents: 'none',
            }}
          />
        </span>
      );
    })}
    <style>
      {`
        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.28;
          }
          50% {
            opacity: 0.38;
            transform: translateY(-50vh) scale(1.04);
          }
          100% {
            transform: translateY(-100vh) scale(1.12);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
      `}
    </style>
  </div>
);

export default BubbleBackground; 