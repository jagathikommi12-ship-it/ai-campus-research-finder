const STATUSES = ['emailed', 'responded', 'meeting scheduled', 'rejected'];

export default function TrackerPage({ tracked, onUpdateStatus, onDelete }) {
  return (
    <div className="page">
      <div className="tracker-header">
        <h2>My outreach</h2>
        <p>
          {tracked.length === 0
            ? 'No professors tracked yet.'
            : `${tracked.length} professor${tracked.length !== 1 ? 's' : ''} tracked`}
        </p>
      </div>

      {tracked.length === 0 ? (
        <p className="tracker-empty">
          Find a professor and click "Track outreach" to add them here.
        </p>
      ) : (
        tracked.map((entry, i) => (
          <div key={i} className="tracker-card">
            <div className="tracker-left">
              <div className="tracker-name">{entry.prof.name}</div>
              <div className="tracker-dept">{entry.prof.department} · {entry.prof.title || 'Faculty'}</div>
            </div>
            <div className="tracker-right">
              <select
                className="status-select"
                value={entry.status}
                onChange={e => onUpdateStatus(i, e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <button className="tracker-del" onClick={() => onDelete(i)} title="Remove">×</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
