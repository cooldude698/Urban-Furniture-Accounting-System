import React, { useEffect, useState, useRef } from 'react';

interface FlashNumberProps {
  value: string | number;
  className?: string;
  style?: React.CSSProperties;
  formatter?: (val: string | number) => React.ReactNode;
}

/**
 * FlashNumber — Highlights report figures with a 600ms `--posted-bg` flash
 * whenever the value changes (or on live data updates via Socket.IO/polling).
 * Designed for high visibility during live demos.
 */
export const FlashNumber: React.FC<FlashNumberProps> = ({
  value,
  className = '',
  style,
  formatter,
}) => {
  const [flashing, setFlashing] = useState(false);
  const prevValue = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setFlashing(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setFlashing(false);
      }, 600);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span
      className={`${flashing ? 'animate-figure-flash' : ''} ${className}`}
      style={{
        padding: '2px 4px',
        borderRadius: 'var(--radius-sm)',
        display: 'inline-block',
        ...style,
      }}
    >
      {formatter ? formatter(value) : value}
    </span>
  );
};

export default FlashNumber;
