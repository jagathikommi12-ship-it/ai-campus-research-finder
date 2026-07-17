import { useState } from 'react';
import EmailModal from './EmailModal';
import PrepModal from './PrepModal';

export default function ProfessorCard({ prof, topic, resumeData, isTracked, onTrack, API }) {
  const [emailOpen, setEmailOpen]   = useState(false);
  const [prepOpen, setPrepOpen]     = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [details, setDetails]       = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(prof.name)}`;

  const handleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (details) return; // already loaded
    setDetailsLoading(true);
    try {
      const res  = await fetch(`${API}/api/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professor: prof, topic })
      });
      const data = await res.json();
      setDetails(data);
    } catch {
      setDetails({ fullDescription: 'Could not load details.', techStack: [], whatYoullDo: '', recentFocus: '', goodFitIf: [] });
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className={`prof-card ${expanded ? 'prof-card--expanded' : ''}`}>
      <div className="prof-header">
        <div>
          <div className="prof-name">{prof.name}</div>
          <div className="prof-title">{prof.title || 'Faculty'}</div>
          {prof.email && (
            <a href={`mailto:${prof.email}`} className="prof-email">{prof.email}</a>
          )}
        </div>
        <span className="dept-badge">{prof.department}</span>
      </div>

      <div className="prof-section-label">What they work on</div>
      <div className="prof-simplified">{prof.simplified}</div>

      <div className="prof-section-label">Why this matches</div>
      <div className="prof-why">{prof.whyRelevant}</div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="prof-details">
          {detailsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: 0 }} />
              <span className="generating">Loading research details...</span>
            </div>
          ) : details && (
            <>
              <div className="details-section">
                <div className="prof-section-label">Deep dive</div>
                <p className="details-text">{details.fullDescription}</p>
              </div>

              {details.recentFocus && (
                <div className="details-section">
                  <div className="prof-section-label">Currently working on</div>
                  <p className="details-text">{details.recentFocus}</p>
                </div>
              )}

              {details.techStack?.length > 0 && (
                <div className="details-section">
                  <div className="prof-section-label">Tech stack</div>
                  <div className="tech-chips">
                    {details.techStack.map((t, i) => (
                      <span key={i} className="tech-chip">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {details.whatYoullDo && (
                <div className="details-section">
                  <div className="prof-section-label">What you'd actually do as an undergrad</div>
                  <p className="details-text">{details.whatYoullDo}</p>
                </div>
              )}

              {details.goodFitIf?.length > 0 && (
                <div className="details-section">
                  <div className="prof-section-label">Good fit if...</div>
                  <div className="fit-list">
                    {details.goodFitIf.map((f, i) => (
                      <div key={i} className="fit-item">✓ {f}</div>
                    ))}
                  </div>
                </div>
              )}

              {details.labMembers?.length > 0 && (
                <div className="details-section">
                  <div className="prof-section-label">Others in this lab</div>
                  <div className="collaborators">
                    {details.labMembers.map((m, i) => (
                      <span key={i} className="collaborator-chip">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="prof-actions" style={{ marginTop: '18px' }}>
        <button className="btn-action btn-primary" onClick={() => setEmailOpen(true)}>
          ✉ Draft cold email
        </button>
        <button className="btn-action" onClick={handleExpand}>
          {expanded ? '▲ Less' : '▼ Learn more'}
        </button>
        <button className="btn-action" onClick={() => setPrepOpen(true)}>
          📋 Meeting prep
        </button>
        <a href={searchUrl} target="_blank" rel="noreferrer" className="btn-action">
          🔗 Papers
        </a>
        {isTracked ? (
          <button className="btn-action btn-tracked" disabled>✓ Tracked</button>
        ) : (
          <button className="btn-action btn-track" onClick={onTrack}>+ Track</button>
        )}
      </div>

      {emailOpen && (
        <EmailModal prof={prof} topic={topic} resumeData={resumeData} API={API} onClose={() => setEmailOpen(false)} />
      )}
      {prepOpen && (
        <PrepModal prof={prof} API={API} onClose={() => setPrepOpen(false)} />
      )}
    </div>
  );
}
