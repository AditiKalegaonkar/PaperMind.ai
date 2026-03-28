/**
 * FlashcardViewer.jsx
 *
 * Used on the dedicated /flashcards route — NOT embedded inside chat bubbles.
 * Supports Grid, List, and Quiz views.
 */

import React, { useState, useEffect } from "react";
import "./FlashcardViewer.css";

const FlashcardViewer = ({ flashcards }) => {
  const [view, setView] = useState("grid"); // 'grid' | 'list' | 'quiz'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState({});
  const [parsedCards, setParsedCards] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (typeof flashcards === "string") {
      try {
        const parsed = JSON.parse(flashcards);
        if (Array.isArray(parsed)) {
          setParsedCards(parsed);
          return;
        }
      } catch (_) {}
      const m = flashcards.match(/\[[\s\S]*\]/);
      if (m) {
        try {
          setParsedCards(JSON.parse(m[0]));
          return;
        } catch (_) {}
      }
      setParsedCards([]);
    } else if (Array.isArray(flashcards)) {
      setParsedCards(flashcards);
    }
  }, [flashcards]);

  const toggleFlip = (i) => setFlipped((p) => ({ ...p, [i]: !p[i] }));
  const nextCard = () => {
    setCurrentIndex((p) => (p + 1) % parsedCards.length);
    setFlipped({});
  };
  const prevCard = () => {
    setCurrentIndex((p) => (p - 1 + parsedCards.length) % parsedCards.length);
    setFlipped({});
  };

  if (!parsedCards.length)
    return <div className="pm-flashcard-empty">No flashcards available.</div>;

  // ── Tab bar (shared) ─────────────────────────────────────────────────────
  const Tabs = () => (
    <div className="pm-flashcard-tabs">
      {["grid", "list", "quiz"].map((v) => (
        <button
          key={v}
          className={`pm-flashcard-tab${view === v ? " active" : ""}`}
          onClick={() => {
            setView(v);
            setFlipped({});
            setCurrentIndex(0);
          }}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>
  );

  // ── Grid view ────────────────────────────────────────────────────────────
  if (view === "grid")
    return (
      <div className="pm-flashcard-viewer">
        <div className="pm-flashcard-header">
          <h3>Flashcards ({parsedCards.length})</h3>
          <Tabs />
        </div>

        <div className="pm-flashcard-grid">
          {parsedCards.map((card, i) => {
            const isFlipped = flipped[i];

            return (
              <div
                key={i}
                className={`pm-flashcard-grid-item${isFlipped ? " flipped" : ""}`}
                onClick={() => toggleFlip(i)}
              >
                {!isFlipped ? (
                  <div className="pm-flashcard-grid-front">
                    <div className="pm-flashcard-label">Question</div>
                    <div className="pm-flashcard-question">{card.question}</div>
                    <div className="pm-flashcard-hint">Click to reveal</div>
                  </div>
                ) : (
                  <div className="pm-flashcard-grid-back">
                    <div className="pm-flashcard-label">Answer</div>
                    <div className="pm-flashcard-answer">{card.answer}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

  // ── List view ────────────────────────────────────────────────────────────
  if (view === "list")
    return (
      <div className="pm-flashcard-viewer">
        <div className="pm-flashcard-header">
          <h3>Flashcards ({parsedCards.length})</h3>
          <Tabs />
        </div>
        <div className="pm-flashcard-list">
          {parsedCards.map((card, i) => (
            <div key={i} className="pm-flashcard-list-item">
              <details>
                <summary className="pm-flashcard-list-question">
                  <span>{card.question}</span>
                  <span className="pm-flashcard-expand-icon"></span>
                </summary>
                <div className="pm-flashcard-list-answer">{card.answer}</div>
              </details>
            </div>
          ))}
        </div>
      </div>
    );

  // ── Quiz view ────────────────────────────────────────────────────────────
  return (
    <div className="pm-flashcard-viewer">
      <div className="pm-flashcard-header">
        <h3>
          Quiz ({currentIndex + 1} / {parsedCards.length})
        </h3>
        <Tabs />
      </div>

      <div className="pm-flashcard-quiz">
        <div
          className={`pm-flashcard-quiz-card${showAnswer ? " flipped" : ""}`}
        >
          {!showAnswer ? (
            <div className="pm-flashcard-quiz-front">
              <div className="pm-flashcard-quiz-label">Question</div>
              <div className="pm-flashcard-quiz-content">
                {parsedCards[currentIndex]?.question}
              </div>
              <div className="pm-flashcard-quiz-hint">
                Press button to reveal answer
              </div>
            </div>
          ) : (
            <div className="pm-flashcard-quiz-back">
              <div className="pm-flashcard-quiz-label">Answer</div>
              <div className="pm-flashcard-quiz-content">
                {parsedCards[currentIndex]?.answer}
              </div>
            </div>
          )}
        </div>

        <button
          className="pm-flashcard-quiz-btn"
          onClick={() => setShowAnswer((v) => !v)}
        >
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </button>

        <div className="pm-flashcard-quiz-nav">
          <button
            onClick={() => {
              setShowAnswer(false);
              prevCard();
            }}
            className="pm-flashcard-quiz-btn"
          >
            ← Previous
          </button>

          <button
            onClick={() => {
              setShowAnswer(false);
              nextCard();
            }}
            className="pm-flashcard-quiz-btn"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;
