import React from 'react';

/**
 * Standardized Loading Spinner for TheHorizon.
 * Minimalist, elegant, pure CSS circular spinner matching TheHorizon white theme.
 * Fully supports prefers-reduced-motion and screen reader accessibility.
 */
export default function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  inline = false,
  fullPage = false,
  minHeight,
  style = {},
  variant = 'accent' // 'accent' (brand blue #2563eb) or 'default' (sleek slate #0f172a)
}) {
  const containerStyle = {
    ...(minHeight ? { minHeight } : {}),
    ...style
  };

  const containerClasses = [
    'horizon-loading-container',
    inline ? 'inline' : '',
    fullPage ? 'full-page' : ''
  ].filter(Boolean).join(' ');

  const spinnerClasses = [
    'horizon-spinner',
    size,
    variant === 'accent' ? 'accent' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={containerStyle} role="status" aria-live="polite">
      <div className={spinnerClasses} aria-hidden="true" />
      {label && <span className={`horizon-loading-text ${size === 'sm' ? 'sm' : ''}`}>{label}</span>}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        Loading
      </span>
    </div>
  );
}
