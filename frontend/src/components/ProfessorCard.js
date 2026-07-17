import { useState } from 'react';
import EmailModal from './EmailModal';
import PrepModal from './PrepModal';

export default function ProfessorCard({ prof, topic, studentBackground, isTracked, onTrack, API }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [prepOpen, setPrepOpen]   = useState(false);

  return (
    <div className="prof-card">
      <div className="prof-header">
        <div>
          <div className="prof-name">{prof.name}</div>
          <div className="prof-title">{prof.title || 'Faculty'}</div>
        </div>
        <span className="dept-badge">{prof.department}</span>
      </div>

      <div className="prof-section-label">What they work on</div>
      <div className="prof-simplified">{prof.simplified}</div>

      <div className="prof-section-label">Why this matches</div>
      <div className="prof-why">{prof.whyRelevant}</div>

      <div className="prof-actions">
        <button className="btn-action btn-primary" onClick={() => setEmailOpen(true)}>
          ✉ Draft cold email
        </button>
        <button className="btn-action" onClick={() => setPrepOpen(true)}>
          📋 Meeting prep
        </button>
        {isTracked ? (
          <button className="btn-action btn-tracked" disabled>
            ✓ Tracked
          </button>
        ) : (
          <button className="btn-action btn-track" onClick={onTrack}>
            + Track outreach
          </button>
        )}
      </div>

      {emailOpen && (
        <EmailModal
          prof={prof}
          topic={topic}
          studentBackground={studentBackground}
          API={API}
          onClose={() => setEmailOpen(false)}
        />
      )}
      {prepOpen && (
        <PrepModal
          prof={prof}
          API={API}
          onClose={() => setPrepOpen(false)}
        />
      )}
    </div>
  );
}
