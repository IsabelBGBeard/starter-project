import React from 'react';

interface ColumnButtonProps {
  label: string;
  state: 'default' | 'hover' | 'selected' | 'disabled';
  onClick?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}

const base = 'inline-flex items-center justify-center font-medium transition-colors duration-100 px-3 py-1 text-sm';
const stateStyles: Record<string, string> = {
  default: 'bg-white text-[var(--color-canva-text,#0E1318)] border border-gray-300 hover:bg-gray-50 rounded-[8px]',
  hover: 'bg-gray-50 text-[var(--color-canva-text,#0E1318)] border border-gray-400 rounded-[8px]',
  selected: 'text-white border border-[var(--purple-06,#8B3DFF)]', // bg and radius via style
  disabled: 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed rounded-[8px]',
};

export const ColumnButton: React.FC<ColumnButtonProps> = ({ label, state, onClick, disabled, leftIcon }) => (
  <button
    type="button"
    className={`${base} ${stateStyles[state]}`}
    style={state === 'selected'
      ? { background: 'var(--purple-06, #8B3DFF)', borderRadius: 'var(--radius-element-standard, 8px)' }
      : undefined}
    onClick={onClick}
    disabled={disabled || state === 'disabled'}
    tabIndex={disabled || state === 'disabled' ? -1 : 0}
    aria-disabled={disabled || state === 'disabled'}
  >
    {leftIcon && (
      <span className={`mr-2 flex items-center ${state === 'selected' ? 'text-white fill-white' : 'text-[var(--color-canva-text,#0E1318)] fill-[var(--color-canva-text,#0E1318)]'}`}>{leftIcon}</span>
    )}
    <span>{label}</span>
  </button>
); 