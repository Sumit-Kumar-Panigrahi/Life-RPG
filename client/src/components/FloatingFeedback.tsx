import React from 'react';

export interface FloatingItem {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface FloatingFeedbackProps {
  items: FloatingItem[];
}

export const FloatingFeedback: React.FC<FloatingFeedbackProps> = ({ items }) => {
  return (
    <div className="floating-xp-container" aria-hidden="true">
      {items.map(item => (
        <div
          key={item.id}
          className="floating-text"
          style={{
            position: 'absolute',
            left: `${item.x}px`,
            top: `${item.y}px`,
            color: item.color
          }}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
