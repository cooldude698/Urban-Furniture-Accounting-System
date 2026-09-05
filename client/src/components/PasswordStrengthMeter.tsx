import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  showChecklist?: boolean;
}

export function calculatePasswordStrength(password: string) {
  const hasLength = password.length > 8; // > 8 characters (at least 9)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasLower) score++;
  if (hasUpper) score++;
  if (hasSpecial) score++;

  const isValid = hasLength && hasLower && hasUpper && hasSpecial;

  let label = 'Too Short';
  let color = '#DC2626'; // Red
  let percent = 10;

  if (password.length === 0) {
    label = 'Empty';
    color = '#A8836C';
    percent = 0;
  } else if (score === 1) {
    label = 'Weak';
    color = '#DC2626';
    percent = 25;
  } else if (score === 2) {
    label = 'Fair';
    color = '#EA580C';
    percent = 50;
  } else if (score === 3) {
    label = 'Good';
    color = '#D97706';
    percent = 75;
  } else if (score === 4) {
    label = 'Strong';
    color = '#16A34A';
    percent = 100;
  }

  return {
    hasLength,
    hasLower,
    hasUpper,
    hasSpecial,
    hasNumber,
    score,
    isValid,
    label,
    color,
    percent,
  };
}

export default function PasswordStrengthMeter({
  password,
  showChecklist = true,
}: PasswordStrengthMeterProps) {
  const { hasLength, hasLower, hasUpper, hasSpecial, percent, color, label, isValid } =
    calculatePasswordStrength(password);

  if (!password) return null;

  const rules = [
    {
      id: 'length',
      label: `More than 8 characters (${password.length}/9+)`,
      met: hasLength,
    },
    {
      id: 'upper',
      label: 'At least one uppercase letter (A-Z)',
      met: hasUpper,
    },
    {
      id: 'lower',
      label: 'At least one lowercase letter (a-z)',
      met: hasLower,
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*)',
      met: hasSpecial,
    },
  ];

  return (
    <div
      style={{
        marginTop: 10,
        marginBottom: 12,
        padding: '10px 14px',
        background: '#FAF7F2',
        borderRadius: 8,
        border: '1px solid var(--brown-200, #DFBF9F)',
        animation: 'fadeIn 0.25s ease-in-out',
      }}
    >
      {/* Header with Strength Label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-800, #5E453A)' }}>
          Password Strength:
        </span>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: color,
            padding: '2px 8px',
            borderRadius: 4,
            background: `${color}18`,
            transition: 'all 0.3s ease',
          }}
        >
          {label}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: 'var(--brown-100, #EBD7BE)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: showChecklist ? 10 : 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: color,
            borderRadius: 4,
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.35s ease',
            boxShadow: isValid ? '0 0 8px rgba(22, 163, 74, 0.4)' : 'none',
          }}
        />
      </div>

      {/* Checklist */}
      {showChecklist && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 4,
            fontSize: '0.72rem',
          }}
        >
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: rule.met ? '#16A34A' : 'var(--brown-600, #8F6C57)',
                fontWeight: rule.met ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {rule.met ? (
                <CheckCircle2 size={13} style={{ color: '#16A34A', flexShrink: 0 }} />
              ) : (
                <XCircle size={13} style={{ color: 'var(--brown-400, #BC987E)', flexShrink: 0 }} />
              )}
              <span>{rule.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
