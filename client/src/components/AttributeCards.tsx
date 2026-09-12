import React from 'react';
import { Dumbbell, Brain, Sparkles, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AttributeCards: React.FC = () => {
  const { attributes } = useAuth();

  const getAttr = (name: string) => {
    return attributes.find(a => a.attribute_name === name) || { level: 1, points: 0 };
  };

  const strength = getAttr('STRENGTH');
  const intellect = getAttr('INTELLECT');
  const discipline = getAttr('DISCIPLINE');
  const creativity = getAttr('CREATIVITY');

  const cards = [
    {
      id: 'strength',
      name: 'Strength',
      icon: Dumbbell,
      level: strength.level,
      points: strength.points % 100,
      maxPoints: 100,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      desc: 'Physical vitality & workouts'
    },
    {
      id: 'intellect',
      name: 'Intellect',
      icon: Brain,
      level: intellect.level,
      points: intellect.points % 100,
      maxPoints: 100,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      desc: 'Coding, study & knowledge'
    },
    {
      id: 'discipline',
      name: 'Discipline',
      icon: Sparkles,
      level: discipline.level,
      points: discipline.points % 100,
      maxPoints: 100,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      desc: 'Habits, meditation & focus'
    },
    {
      id: 'creativity',
      name: 'Creativity',
      icon: Palette,
      level: creativity.level,
      points: creativity.points % 100,
      maxPoints: 100,
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.15)',
      desc: 'Design, writing & art'
    }
  ];

  return (
    <section className="attribute-grid" aria-label="Character Attributes">
      {cards.map(card => {
        const Icon = card.icon;
        const percent = Math.min(100, Math.round((card.points / card.maxPoints) * 100));

        return (
          <div
            key={card.id}
            className="glass-panel attribute-card"
            style={{
              borderLeft: `3px solid ${card.color}`
            }}
          >
            <div className="attr-top-row">
              <div
                className="attr-icon-box"
                style={{
                  background: card.bgGlow,
                  color: card.color
                }}
              >
                <Icon size={20} />
              </div>
              <span className="attr-level-tag">Lv. {card.level}</span>
            </div>

            <h3 className="attr-name">{card.name}</h3>

            <div className="attr-progress-wrap">
              <div className="attr-progress-track">
                <div
                  className="attr-progress-fill"
                  style={{
                    width: `${percent}%`,
                    background: card.color,
                    boxShadow: `0 0 10px ${card.bgGlow}`
                  }}
                />
              </div>
              <div className="attr-progress-numbers">
                <span>Progress</span>
                <span>
                  <strong>{card.points}</strong> / {card.maxPoints}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};
