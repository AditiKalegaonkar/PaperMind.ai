/**
 * FlashcardsPage.jsx
 *
 * Dedicated route: /flashcards
 * Reads flashcard data from React Router location.state (preferred) or
 * sessionStorage (fallback for hard-reload).
 *
 * Usage: navigate('/flashcards', { state: { cards, summary } })
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FlashcardViewer from './FlashcardViewer';

export default function FlashcardsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [cards, setCards] = useState(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    // Prefer data passed through router state (no serialisation round-trip)
    if (location.state?.cards) {
      setCards(location.state.cards);
      setSummary(location.state.summary || '');
      // Also persist to sessionStorage so a page refresh still works
      sessionStorage.setItem('pm_flashcards', JSON.stringify(location.state.cards));
      if (location.state.summary)
        sessionStorage.setItem('pm_flashcards_summary', location.state.summary);
      return;
    }
    // Fallback: try sessionStorage (handles F5 / hard-reload)
    const stored = sessionStorage.getItem('pm_flashcards');
    if (stored) {
      try { setCards(JSON.parse(stored)); } catch (_) {}
    }
    const storedSummary = sessionStorage.getItem('pm_flashcards_summary');
    if (storedSummary) setSummary(storedSummary);
  }, [location.state]);

  return (
    <div className="pm-flashcards-page">
      <div className="pm-flashcards-page-header">
        <button className="pm-flashcards-back-btn" onClick={() => navigate(-1)}>
          ← Back to chat
        </button>
        <h1 className="pm-flashcards-page-title">Flashcards</h1>
      </div>

      {/*{summary && (
        <div className="pm-flashcards-summary">
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}*/}

      {cards ? (
        <FlashcardViewer flashcards={cards} />
      ) : (
        <div className="pm-flashcard-empty">
          No flashcards found. Go back and ask the Education agent to generate some.
        </div>
      )}
    </div>
  );
}