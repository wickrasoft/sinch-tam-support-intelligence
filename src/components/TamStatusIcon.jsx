import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TAM_STATUS_CONFIG, getTamAvailabilityStatus } from '../utils/tamStatus';
import { getTamLocalTime, getTamLocalTimeParts, getTamTimezone } from '../utils/tamAvailability';

/** A single dial that shows availability (status sign as backdrop) and time (hands). */
function AnalogClock({ hour, minute, status, icon }) {
  const minuteAngle = minute * 6;
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const C = 20; // center of a 40x40 viewBox
  const clipId = useId();

  return (
    <svg
      className={`tam-status-icon__dial tam-status-icon__dial--${status}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={C} cy={C} r="18" />
        </clipPath>
      </defs>
      <circle className="tam-status-icon__dial-face" cx={C} cy={C} r="18" />
      {icon && (
        <text
          className="tam-status-icon__dial-sign"
          x={C}
          y={C}
          textAnchor="middle"
          dominantBaseline="central"
          clipPath={`url(#${clipId})`}
        >
          {icon}
        </text>
      )}
      <line
        className="tam-status-icon__dial-hand tam-status-icon__dial-hand--hour"
        x1={C}
        y1={C}
        x2={C}
        y2="11"
        transform={`rotate(${hourAngle} ${C} ${C})`}
      />
      <line
        className="tam-status-icon__dial-hand tam-status-icon__dial-hand--minute"
        x1={C}
        y1={C}
        x2={C}
        y2="7"
        transform={`rotate(${minuteAngle} ${C} ${C})`}
      />
      <circle className="tam-status-icon__dial-pin" cx={C} cy={C} r="1.5" />
    </svg>
  );
}

const TOOLTIP_WIDTH = 220;
const TOOLTIP_MARGIN = 8;

function StatusTooltipPortal({ open, anchorRef, title, details }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    let left = rect.left;
    const top = rect.bottom + 6;

    if (left + TOOLTIP_WIDTH > window.innerWidth - TOOLTIP_MARGIN) {
      left = window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_MARGIN;
    }
    left = Math.max(TOOLTIP_MARGIN, left);

    setCoords({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return undefined;

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  if (!open) return null;

  return createPortal(
    <div
      className="tam-status-tooltip__popup tam-status-tooltip__popup--fixed"
      style={{ top: coords.top, left: coords.left, width: TOOLTIP_WIDTH }}
      role="tooltip"
    >
      <span className="tam-status-tooltip__title">{title}</span>
      {details.map((line) => (
        <span key={line} className="tam-status-tooltip__detail">{line}</span>
      ))}
    </div>,
    document.body,
  );
}

export default function TamStatusIcon({
  tam,
  status: statusProp,
  showLabel = false,
  className = '',
  showTooltip = false,
  details = [],
}) {
  const triggerRef = useRef(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [clockNow, setClockNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const status = statusProp ?? getTamAvailabilityStatus(tam);
  const config = TAM_STATUS_CONFIG[status];
  if (!config?.icon) return null;

  const localTime = getTamLocalTime(tam, clockNow);
  const localParts = getTamLocalTimeParts(tam, clockNow);
  const timezone = getTamTimezone(tam);

  const tooltipDetails = [
    ...(localTime ? [`Local time ${localTime}${timezone ? ` (${timezone})` : ''}`] : []),
    ...details,
    ...(details.length === 0 && config.detail ? [config.detail] : []),
  ];

  const iconBody = (
    <>
      {localParts ? (
        <AnalogClock
          hour={localParts.hour}
          minute={localParts.minute}
          status={status}
          icon={config.icon}
        />
      ) : (
        <span className="tam-status-icon__emoji" aria-hidden="true">{config.icon}</span>
      )}
      {showLabel && <span className="tam-status-icon__label">{config.label}</span>}
    </>
  );

  if (showTooltip) {
    return (
      <>
        <span
          ref={triggerRef}
          className={`tam-status-icon tam-status-icon--${status} tam-status-tooltip ${className}`.trim()}
          tabIndex={0}
          aria-label={`${config.label}${tooltipDetails.length ? `: ${tooltipDetails.join(', ')}` : ''}`}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          onFocus={() => setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
        >
          {iconBody}
        </span>
        <StatusTooltipPortal
          open={tooltipOpen}
          anchorRef={triggerRef}
          title={config.label}
          details={tooltipDetails}
        />
      </>
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
