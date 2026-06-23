import TamStatusIcon from './TamStatusIcon';
import { TAM_VACATION_TITLE } from '../utils/tamStatus';

/** Shows vacation palm tree; prefer TamStatusIcon for full availability status. */
export default function VacationIndicator({ showLabel = false, className = '' }) {
  return (
    <TamStatusIcon
      status="vacation"
      showLabel={showLabel}
      className={`vacation-badge vacation-badge--inline ${className}`.trim()}
    />
  );
}

export { TAM_VACATION_TITLE };
