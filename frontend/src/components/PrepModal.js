import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function PrepModal({ prof, API, onClose }) {
  const [prep, setPrep]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor: prof })
    })
      .then(r => r.json())
      .then(data => setPrep(data))
      .catch(() => setPrep(null))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Meeting prep — {prof.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p className="generating">Building your prep brief...</p>
          ) : !prep ? (
            <p className="generating">Error loading prep. Is the backend running?</p>
          ) : (
            <>
              <div className="prep-section">
                <div className="prep-section-title">Key concepts to know</div>
                {prep.keyConceptsToKnow?.map((c, i) => (
                  <div key={i} className="prep-item">{c}</div>
                ))}
              </div>
              <div className="prep-section">
                <div className="prep-section-title">Questions to ask</div>
                {prep.questionsToAsk?.map((q, i) => (
                  <div key={i} className="prep-item">{q}</div>
                ))}
              </div>
              <div className="prep-section">
                <div className="prep-section-title">Don't say</div>
                {prep.doNotSay?.map((d, i) => (
                  <div key={i} className="prep-item avoid">{d}</div>
                ))}
              </div>
              <div className="prep-section">
                <div className="prep-section-title">Opening line</div>
                <div className="prep-opening">{prep.openingLine}</div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
