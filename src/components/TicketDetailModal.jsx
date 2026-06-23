import { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { formatDuration, getTicketMttaMinutes, getTicketMttrMinutes } from '../utils/metrics';
import { getZendeskTicketUrl } from '../utils/zendesk';
import { FIELD_OPTIONS } from '../utils/zendeskFieldOptions';
import { useHorizontalResize, PaneResizeHandle, usePaneLayoutStorage } from '../hooks/usePaneResize';
import './ZendeskTicketView.css';

const STATUS_MAP = {
  in_progress: { label: 'Open', className: 'zd-status--open' },
  waiting_for_response: { label: 'Pending', className: 'zd-status--pending' },
  temp_resolution: { label: 'Solved', className: 'zd-status--solved' },
  closed: { label: 'Closed', className: 'zd-status--closed' },
  escalated: { label: 'Open', className: 'zd-status--open' },
};

const PRIORITY_MAP = {
  P1: { label: 'Urgent', className: 'zd-priority--urgent' },
  P2: { label: 'High', className: 'zd-priority--high' },
  P3: { label: 'Normal', className: 'zd-priority--normal' },
  P4: { label: 'Low', className: 'zd-priority--low' },
};

function initials(name) {
  return (name ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function ZdInput({ label, value, required, mono, type = 'text' }) {
  return (
    <div className="zd-form-field">
      <label className="zd-form-field__label">{label}{required ? ' *' : ''}</label>
      <input
        type={type}
        className={`zd-form-field__input ${mono ? 'zd-form-field__input--mono' : ''}`}
        value={value ?? ''}
        readOnly
      />
    </div>
  );
}

function ZdSelect({ label, value, options, required }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div className="zd-form-field">
      <label className="zd-form-field__label">{label}{required ? ' *' : ''}</label>
      <select className="zd-form-field__select" value={value ?? ''} readOnly>
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ZdTextarea({ label, value, required, rows = 2 }) {
  return (
    <div className="zd-form-field">
      <label className="zd-form-field__label">{label}{required ? ' *' : ''}</label>
      <textarea className="zd-form-field__textarea" value={value ?? ''} readOnly rows={rows} />
    </div>
  );
}

function ConversationEvent({ at, text }) {
  return (
    <div className="zd-event">
      <span className="zd-event__icon">●</span>
      <span className="zd-event__text">{text}</span>
      <time className="zd-event__time">{format(parseISO(at), 'MMM d, yyyy, h:mm a')}</time>
    </div>
  );
}

function JiraAppPanel({ zd, ticket }) {
  const jira = zd.jira;
  const hasLink = Boolean(jira?.key ?? zd.jira_key);

  return (
    <div className="zd-app-panel zd-app-panel--jira">
      <header className="zd-app-panel__header">
        <span className="zd-app-panel__logo">◆</span>
        <strong>JIRA</strong>
        <div className="zd-app-panel__actions">
          <button type="button" className="zd-app-icon" title="Refresh">↻</button>
          <button type="button" className="zd-app-icon" title="Pin">📌</button>
          <button type="button" className="zd-app-icon" title="Menu">⋮</button>
        </div>
      </header>
      <div className="zd-app-panel__toolbar">
        <button type="button" className="zd-app-btn">Create issue</button>
        <button type="button" className="zd-app-btn">Link issue</button>
        <button type="button" className="zd-app-btn zd-app-btn--disabled" disabled>Notify</button>
      </div>
      <div className="zd-app-panel__body">
        {hasLink ? (
          <div className="zd-jira-issue">
            <a
              href={jira?.url ?? `https://sinch.atlassian.net/browse/${zd.jira_key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="zd-jira-issue__key"
            >
              {jira?.key ?? zd.jira_key}
            </a>
            <p className="zd-jira-issue__summary">{jira?.summary ?? ticket.subject}</p>
            <div className="zd-jira-issue__meta">
              <span className={`zd-jira-status zd-jira-status--${(jira?.status ?? zd.jira_ticket_status ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
                {jira?.status ?? zd.jira_ticket_status}
              </span>
              {jira?.priority && <span>{jira.priority}</span>}
              {jira?.assignee && <span>{jira.assignee}</span>}
            </div>
          </div>
        ) : (
          <p className="zd-app-panel__empty">There are no linked issues.</p>
        )}
      </div>
    </div>
  );
}

function MailThreadPanel({ zd, ticket, onScrollToConversation }) {
  const mailUrl = zd.mail_thread_url ?? zd.url ?? getZendeskTicketUrl(ticket.zendesk_id);

  return (
    <div className="zd-app-panel zd-app-panel--mail">
      <header className="zd-app-panel__header">
        <span className="zd-app-panel__logo">💬</span>
        <strong>Mail Thread</strong>
      </header>
      <div className="zd-app-panel__body">
        <p className="zd-mail-thread__hint">
          {(ticket.conversation ?? []).length} messages in this thread
        </p>
        <button type="button" className="zd-app-btn zd-app-btn--full" onClick={onScrollToConversation}>
          View conversation
        </button>
        <a href={mailUrl} target="_blank" rel="noopener noreferrer" className="zd-mail-thread__link">
          Open mail thread in Zendesk ↗
        </a>
      </div>
    </div>
  );
}

function AppRail({ activeApp, onSelectApp }) {
  const apps = [
    { id: 'user', icon: '👤', label: 'Customer' },
    { id: 'kb', icon: '📖', label: 'Knowledge' },
    { id: 'mail', icon: '💬', label: 'Mail', badge: 1 },
    { id: 'tags', icon: '🏷', label: 'Tags' },
    { id: 'apps', icon: '⚙', label: 'Apps' },
    { id: 'tasks', icon: '✓', label: 'Tasks' },
    { id: 'grid', icon: '▦', label: 'More' },
    { id: 'jira', icon: '◆', label: 'JIRA' },
  ];

  return (
    <nav className="zd-app-rail" aria-label="Apps">
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className={`zd-app-rail__btn ${activeApp === app.id ? 'zd-app-rail__btn--active' : ''}`}
          title={app.label}
          onClick={() => onSelectApp?.(app.id)}
        >
          <span>{app.icon}</span>
          {app.badge != null && <span className="zd-app-rail__badge">{app.badge}</span>}
        </button>
      ))}
      <button type="button" className="zd-app-rail__btn zd-app-rail__btn--add" title="Add app">+</button>
    </nav>
  );
}

export default function TicketDetailModal({ ticket, onClose }) {
  const conversationRef = useRef(null);
  usePaneLayoutStorage();

  const leftPane = useHorizontalResize({
    initial: 280,
    min: 200,
    max: 420,
    storageKey: 'sinch-tam-ticket-left-pane',
  });

  const rightPane = useHorizontalResize({
    initial: 300,
    min: 220,
    max: 480,
    storageKey: 'sinch-tam-ticket-right-pane',
  });

  useEffect(() => {
    if (!ticket) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ticket, onClose]);

  if (!ticket) return null;

  const zd = ticket.zendesk ?? {};
  const sinch = ticket.sinch ?? {};
  const zendeskUrl = ticket.zendesk_url ?? getZendeskTicketUrl(ticket.zendesk_id);
  const status = STATUS_MAP[ticket.disposition] ?? STATUS_MAP.in_progress;
  const priority = PRIORITY_MAP[ticket.priority] ?? PRIORITY_MAP.P3;
  const priorityLabel = zd.priority_label ?? ticket.priority;

  const scrollToConversation = () => {
    conversationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="zd-overlay" onClick={onClose} role="presentation">
      <div
        className="zd-workspace zd-workspace--wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Zendesk ticket ${ticket.zendesk_id}`}
      >
        <div className="zd-chrome">
          <div className="zd-chrome__left">
            <span className="zd-chrome__dot zd-chrome__dot--red" />
            <span className="zd-chrome__dot zd-chrome__dot--yellow" />
            <span className="zd-chrome__dot zd-chrome__dot--green" />
            <span className="zd-chrome__brand">Zendesk Agent</span>
          </div>
          <div className="zd-chrome__url-bar">
            <span className="zd-chrome__lock">🔒</span>
            <span className="zd-chrome__url">{zendeskUrl}</span>
          </div>
          <button type="button" className="zd-chrome__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="zd-toolbar">
          <div className="zd-toolbar__left">
            <span className="zd-toolbar__ticket-num">Ticket #{ticket.zendesk_id}</span>
            <span className={`zd-status ${status.className}`}>{status.label}</span>
            <span className={`zd-priority ${priority.className}`}>{priority.label}</span>
            {ticket.sla?.any_breach && <span className="zd-sla-badge">SLA breached</span>}
            {ticket.is_stale && <span className="zd-sla-badge">No update 72h+</span>}
          </div>
          <div className="zd-toolbar__right">
            <a href={zendeskUrl} target="_blank" rel="noopener noreferrer" className="zd-btn zd-btn--link">
              Open in new tab ↗
            </a>
            <button type="button" className="zd-btn zd-btn--secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="zd-subject-bar">
          <h1 className="zd-subject">{ticket.subject}</h1>
          <p className="zd-subject-meta">
            via {zd.case_origin ?? ticket.channel} · {ticket.account_name} ·
            {' '}Created {format(parseISO(ticket.created_at), 'MMM d, yyyy h:mm a')}
            {ticket.last_updated_at && (
              <> · Updated {format(parseISO(ticket.last_updated_at), 'MMM d, yyyy h:mm a')}</>
            )}
          </p>
        </div>

        <div className="zd-layout zd-layout--three">
          {/* Left pane — ticket fields as form controls */}
          <aside className="zd-fields-pane" style={{ width: leftPane.size, flexBasis: leftPane.size }}>
            <div className="zd-fields-pane__header">Ticket fields</div>
            <div className="zd-fields-pane__scroll">
              <div className="zd-requester-card zd-requester-card--compact">
                <div className="zd-avatar zd-avatar--customer">{initials(zd.requester?.name)}</div>
                <div>
                  <div className="zd-requester-card__name">{zd.requester?.name ?? ticket.requester?.name}</div>
                  <div className="zd-requester-card__email">{zd.requester?.email ?? ticket.requester?.email}</div>
                </div>
              </div>

              <ZdInput label="Requester email" value={zd.requester?.email ?? ticket.requester?.email} />
              <ZdInput label="Assignee" value={zd.assignee?.name ?? ticket.tam_name} required />
              <ZdInput
                label="Followers"
                value={zd.followers?.map((f) => f.name).join(', ') ?? ''}
              />
              <ZdSelect label="Sharing" value={zd.sharing} options={FIELD_OPTIONS.sharing} />
              <ZdSelect label="Form" value={zd.form} options={FIELD_OPTIONS.form} />
              <ZdInput label="Tags" value={(zd.tags ?? ticket.tags ?? []).join(', ')} />
              <ZdSelect label="Type" value={zd.type ?? ticket.type} options={FIELD_OPTIONS.type} />
              <ZdSelect label="Priority" value={priorityLabel} options={FIELD_OPTIONS.priority} />
              <ZdInput
                label="Linked problem"
                value={zd.linked_problem ? `#${zd.linked_problem.zendesk_id} — ${zd.linked_problem.subject ?? ''}` : ''}
                mono
              />
              <ZdSelect label="Impact" value={zd.impact} options={FIELD_OPTIONS.impact} required />
              <ZdSelect label="Region" value={zd.region ?? sinch.region} options={FIELD_OPTIONS.region} required />
              <ZdSelect label="Product" value={zd.product ?? sinch.product} options={FIELD_OPTIONS.product} required />
              <ZdSelect label="Case type" value={zd.case_type} options={FIELD_OPTIONS.case_type} required />
              <ZdInput label="Issue category" value={zd.issue_category} required />
              <ZdInput label="Destination country" value={zd.destination_country} required />
              <ZdSelect label="Issue source" value={zd.issue_source} options={FIELD_OPTIONS.issue_source} required />
              <ZdSelect label="Root cause" value={zd.root_cause} options={FIELD_OPTIONS.root_cause} required />
              <ZdSelect label="Resolution" value={zd.resolution} options={FIELD_OPTIONS.resolution} required />
              <ZdSelect label="Escalated team" value={zd.escalated_team ?? ticket.escalated_to} options={FIELD_OPTIONS.escalated_team} />
              <ZdInput label="Vendor / supplier" value={zd.vendor_supplier_name} />
              <ZdInput label="Supplier ticket ID" value={zd.supplier_ticket_id} mono />
              <ZdInput
                label="Linked tickets"
                value={zd.linked_tickets?.map((lt) => `#${lt.zendesk_id}`).join(', ') ?? ''}
                mono
              />
              <ZdSelect label="Case origin" value={zd.case_origin} options={FIELD_OPTIONS.case_origin} />
              <ZdSelect label="Jira status" value={zd.jira_ticket_status} options={FIELD_OPTIONS.jira_status} />
              <ZdInput label="Jira key" value={zd.jira_key} mono />
              <ZdSelect
                label="In progress"
                value={String(zd.in_progress ?? false)}
                options={FIELD_OPTIONS.in_progress}
              />
              <ZdInput
                label="Follow-up date"
                type="date"
                value={zd.follow_up_date ? format(parseISO(zd.follow_up_date), 'yyyy-MM-dd') : ''}
              />

              <details className="zd-fields-pane__tech">
                <summary>Sinch technical fields</summary>
                <ZdInput label="Project ID" value={sinch.project_id} mono />
                <ZdInput label="Service plan" value={sinch.service_plan_id} mono />
                <ZdInput label="MTTA (reply time)" value={formatDuration(getTicketMttaMinutes(ticket))} />
                <ZdInput label="MTTR (full resolution)" value={formatDuration(getTicketMttrMinutes(ticket))} />
                {ticket.zendesk?.metrics?.reply_time_in_minutes && (
                  <ZdInput
                    label="Reply time (business hrs)"
                    value={formatDuration(ticket.zendesk.metrics.reply_time_in_minutes.business)}
                  />
                )}
                {ticket.zendesk?.metrics?.full_resolution_time_in_minutes && (
                  <ZdInput
                    label="Resolution time (business hrs)"
                    value={formatDuration(ticket.zendesk.metrics.full_resolution_time_in_minutes.business)}
                  />
                )}
                <ZdInput label="CSAT" value={ticket.csat?.score != null ? `${ticket.csat.score}/5` : ''} />
                {ticket.csat?.comment && (
                  <ZdTextarea label="CSAT comment" value={ticket.csat.comment} rows={3} />
                )}
              </details>
            </div>
          </aside>

          <PaneResizeHandle
            side="left"
            label="Resize ticket fields pane"
            onMouseDown={(e) => leftPane.startDrag('left', e)}
          />

          {/* Center — conversation */}
          <main className="zd-main" ref={conversationRef}>
            <div className="zd-tabs">
              <button type="button" className="zd-tabs__btn zd-tabs__btn--active">Conversation</button>
              <button type="button" className="zd-tabs__btn">
                Events {ticket.reopen_events?.length ? `(${ticket.reopen_events.length + 2})` : '(2)'}
              </button>
            </div>

            <div className="zd-conversation">
              <ConversationEvent
                at={ticket.created_at}
                text={`Ticket created by ${zd.requester?.name ?? ticket.requester?.name}`}
              />

              {(ticket.conversation ?? []).map((msg, i) => (
                <article key={i} className={`zd-comment zd-comment--${msg.author}`}>
                  <div className={`zd-avatar zd-avatar--${msg.author}`}>
                    {initials(msg.author_name)}
                  </div>
                  <div className="zd-comment__body">
                    <header className="zd-comment__header">
                      <strong>{msg.author_name}</strong>
                      <span className="zd-comment__via">
                        {msg.author === 'customer' ? 'Via email' : msg.author === 'agent' ? 'Agent reply' : 'System'}
                      </span>
                      <time>{format(parseISO(msg.at), 'MMM d, yyyy, h:mm a')}</time>
                    </header>
                    <div className="zd-comment__content">{msg.body}</div>
                  </div>
                </article>
              ))}

              {ticket.reopen_events?.map((ev) => (
                <ConversationEvent
                  key={ev.event_number}
                  at={ev.reopened_at}
                  text={`Ticket reopened (reopen #${ev.event_number})`}
                />
              ))}

              {ticket.disposition === 'closed' && ticket.closed_at && (
                <ConversationEvent at={ticket.closed_at} text="Ticket closed" />
              )}
            </div>

            <div className="zd-composer">
              <div className="zd-composer__tabs">
                <span className="zd-composer__tab zd-composer__tab--active">Public reply</span>
                <span className="zd-composer__tab">Internal note</span>
              </div>
              <div className="zd-composer__box">
                <p className="zd-composer__placeholder">
                  Reply to {zd.requester?.name ?? 'requester'}… (read-only preview)
                </p>
              </div>
              <div className="zd-composer__actions">
                <button type="button" className="zd-btn zd-btn--primary" disabled>Submit</button>
              </div>
            </div>
          </main>

          <PaneResizeHandle
            side="right"
            label="Resize apps pane"
            onMouseDown={(e) => rightPane.startDrag('right', e)}
          />

          {/* Right pane — JIRA + mail thread apps */}
          <aside className="zd-apps-pane" style={{ width: rightPane.size, flexBasis: rightPane.size }}>
            <div className="zd-apps-pane__scroll">
              <JiraAppPanel zd={zd} ticket={ticket} />
              <MailThreadPanel zd={zd} ticket={ticket} onScrollToConversation={scrollToConversation} />
            </div>
            <AppRail activeApp="jira" />
          </aside>
        </div>
      </div>
    </div>
  );
}
