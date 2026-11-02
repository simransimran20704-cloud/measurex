import React, { useRef, useState, useEffect } from 'react';

interface MagneticCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0 to 1
  spotlightColor?: string;
  borderColor?: string;
  enableMagnetic?: boolean;
}

export const MagneticCard: React.FC<MagneticCardProps> = ({
  children,
  className = '',
  intensity = 0.25,
  spotlightColor = 'rgba(67, 133, 232, 0.15)',
  borderColor = 'rgba(128, 100, 232, 0.3)',
  enableMagnetic = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)');
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    // Only enable 3D tilt on devices that support hover and fine pointers
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setCanHover(mq.matches);

    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !canHover || !enableMagnetic) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Percentages for spotlight
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    setSpotlightPos({ x: xPercent, y: yPercent, opacity: 1 });

    // Center offset (-1 to 1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;

    // 3D tilt calculation
    const rotateX = -deltaY * (10 * intensity);
    const rotateY = deltaX * (10 * intensity);
    const moveX = deltaX * (8 * intensity);
    const moveY = deltaY * (8 * intensity);

    setTransform(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(${moveX.toFixed(1)}px, ${moveY.toFixed(1)}px, 12px)`);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)');
    setSpotlightPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: isHovered ? 'transform 0.1s ease-out, box-shadow 0.25s ease' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-card-subtle hover:shadow-aurora transition-all duration-300 ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Spotlight */}
      {canHover && (
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300 z-10"
          style={{
            opacity: spotlightPos.opacity,
            background: `radial-gradient(400px circle at ${spotlightPos.x}% ${spotlightPos.y}%, ${spotlightColor}, transparent 60%)`,
          }}
        />
      )}

      {/* Border Glow Gradient on Hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border transition-opacity duration-300 z-20"
        style={{
          borderColor: isHovered ? borderColor : 'rgba(226, 232, 240, 0.7)',
          opacity: isHovered ? 1 : 0.6,
        }}
      />

      {/* Card Content with 3D depth */}
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
};
