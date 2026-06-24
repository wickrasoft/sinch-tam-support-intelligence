import { TAM_STATUS_CONFIG, getTamAvailabilityStatus } from '../utils/tamStatus';

export default function TamStatusIcon({
  tam,
  status: statusProp,
  showLabel = false,
  className = '',
  showTooltip = false,
  details = [],
}) {
  const status = statusProp ?? getTamAvailabilityStatus(tam);
  const config = TAM_STATUS_CONFIG[status];
  if (!config?.icon) return null;

  const tooltipDetails = [
    ...details,
    ...(details.length === 0 && config.detail ? [config.detail] : []),
  ];

  const iconBody = (
    <>
      <span className="tam-status-icon__emoji" aria-hidden="true">{config.icon}</span>
      {showLabel && <span className="tam-status-icon__label">{config.label}</span>}
    </>
  );

  if (showTooltip) {
    return (
      <span
        className={`tam-status-icon tam-status-icon--${status} tam-status-tooltip ${className}`.trim()}
        tabIndex={0}
        aria-label={`${config.label}${tooltipDetails.length ? `: ${tooltipDetails.join(', ')}` : ''}`}
      >
        {iconBody}
        <span className="tam-status-tooltip__popup" role="tooltip">
          <span className="tam-status-tooltip__title">{config.label}</span>
          {tooltipDetails.map((line) => (
            <span key={line} className="tam-status-tooltip__detail">{line}</span>
          ))}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`tam-status-icon tam-status-icon--${status} ${className}`.trim()}
      title={config.label}
      aria-label={config.label}
    >
      {iconBody}
    </span>
  );
}
