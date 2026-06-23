import { TAM_STATUS_CONFIG, getTamAvailabilityStatus } from '../utils/tamStatus';

export default function TamStatusIcon({ tam, status: statusProp, showLabel = false, className = '' }) {
  const status = statusProp ?? getTamAvailabilityStatus(tam);
  const config = TAM_STATUS_CONFIG[status];
  if (!config?.icon) return null;

  return (
    <span
      className={`tam-status-icon tam-status-icon--${status} ${className}`.trim()}
      title={config.label}
      aria-label={config.label}
    >
      <span className="tam-status-icon__emoji" aria-hidden="true">{config.icon}</span>
      {showLabel && <span className="tam-status-icon__label">{config.label}</span>}
    </span>
  );
}
