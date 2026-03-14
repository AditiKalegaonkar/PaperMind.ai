import React, { useState, useEffect } from 'react';

const FlashcardViewer = ({ flashcards, onOpenInNewTab }) => {
  const [view, setView] = useState('grid'); // 'grid', 'list', 'quiz'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState({});
  const [parsedCards, setParsedCards] = useState([]);

  useEffect(() => {
    if (typeof flashcards === 'string') {
      try {
        const parsed = JSON.parse(flashcards);
        setParsedCards(parsed);
      } catch (e) {
        console.error('Failed to parse flashcards:', e);
        // Try to extract JSON from text
        const jsonMatch = flashcards.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            setParsedCards(JSON.parse(jsonMatch[0]));
          } catch (e2) {
            setParsedCards([]);
          }
        }
      }
    } else if (Array.isArray(flashcards)) {
      setParsedCards(flashcards);
    }
  }, [flashcards]);

  const toggleFlip = (index) => {
    setFlipped(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const nextCard = () => {
    setCurrentIndex(prev => (prev + 1) % parsedCards.length);
    setFlipped({});
  };

  const prevCard = () => {
    setCurrentIndex(prev => (prev - 1 + parsedCards.length) % parsedCards.length);
    setFlipped({});
  };

  const handleOpenNewTab = (card) => {
    if (onOpenInNewTab) {
      onOpenInNewTab(card);
    } else {
      const url = `data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Flashcard - ${card.question?.slice(0, 30) || 'Study'}</title>
          <style>
            body { 
              font-family: 'DM Sans', sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
              background: #FFF8F0;
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 40px rgba(248, 111, 3, 0.2);
              max-width: 600px;
              width: 90%;
              text-align: center;
            }
            .question { 
              font-size: 20px; 
              font-weight: 600; 
              color: #F86F03; 
              margin-bottom: 20px;
            }
            .answer { 
              font-size: 18px; 
              color: #333; 
              line-height: 1.6;
            }
            .close-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #F86F03;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <button class="close-btn" onclick="window.close()">Close</button>
          <div class="card">
            <div class="question">${card.question || ''}</div>
            <div class="answer">${card.answer || ''}</div>
          </div>
        </body>
        </html>
      `)}`;
      window.open(url, '_blank');
    }
  };

  if (!parsedCards || parsedCards.length === 0) {
    return <div className="pm-flashcard-empty">No flashcards available</div>;
  }

  // Grid View
  if (view === 'grid') {
    return (
      <div className="pm-flashcard-viewer">
        <div className="pm-flashcard-header">
          <h3>Flashcards ({parsedCards.length})</h3>
          <div className="pm-flashcard-tabs">
            <button 
              className={`pm-flashcard-tab ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
            <button 
              className={`pm-flashcard-tab ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button 
              className={`pm-flashcard-tab ${view === 'quiz' ? 'active' : ''}`}
              onClick={() => setView('quiz')}
            >
              Quiz
            </button>
          </div>
        </div>
        <div className="pm-flashcard-grid">
          {parsedCards.map((card, index) => (
            <div 
              key={index} 
              className="pm-flashcard-grid-item"
              onClick={() => handleOpenNewTab(card)}
            >
              <div className="pm-flashcard-question">{card.question}</div>
              <div className="pm-flashcard-answer">{card.answer}</div>
              <button 
                className="pm-flashcard-open-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenNewTab(card);
                }}
              >
                Open in new tab
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List View
  if (view === 'list') {
    return (
      <div className="pm-flashcard-viewer">
        <div className="pm-flashcard-header">
          <h3>Flashcards ({parsedCards.length})</h3>
          <div className="pm-flashcard-tabs">
            <button 
              className={`pm-flashcard-tab ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
            <button 
              className={`pm-flashcard-tab ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button 
              className={`pm-flashcard-tab ${view === 'quiz' ? 'active' : ''}`}
              onClick={() => setView('quiz')}
            >
              Quiz
            </button>
          </div>
        </div>
        <div className="pm-flashcard-list">
          {parsedCards.map((card, index) => (
            <div key={index} className="pm-flashcard-list-item">
              <details>
                <summary className="pm-flashcard-list-question">
                  {card.question}
                  <span className="pm-flashcard-expand-icon">▼</span>
                </summary>
                <div className="pm-flashcard-list-answer">
                  {card.answer}
                  <button 
                    className="pm-flashcard-open-btn"
                    onClick={() => handleOpenNewTab(card)}
                  >
                    Open in new tab
                  </button>
                </div>
              </details>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Quiz View
  return (
    <div className="pm-flashcard-viewer">
      <div className="pm-flashcard-header">
        <h3>Quiz Mode ({currentIndex + 1}/{parsedCards.length})</h3>
        <div className="pm-flashcard-tabs">
          <button 
            className={`pm-flashcard-tab ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button 
            className={`pm-flashcard-tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
          <button 
            className={`pm-flashcard-tab ${view === 'quiz' ? 'active' : ''}`}
            onClick={() => setView('quiz')}
          >
            Quiz
          </button>
        </div>
      </div>
      <div className="pm-flashcard-quiz">
        <div 
          className={`pm-flashcard-quiz-card ${flipped[currentIndex] ? 'flipped' : ''}`}
          onClick={() => toggleFlip(currentIndex)}
        >
          <div className="pm-flashcard-quiz-front">
            <div className="pm-flashcard-quiz-label">Question</div>
            <div className="pm-flashcard-quiz-content">
              {parsedCards[currentIndex]?.question}
            </div>
            <div className="pm-flashcard-quiz-hint">Click to reveal answer</div>
          </div>
          <div className="pm-flashcard-quiz-back">
            <div className="pm-flashcard-quiz-label">Answer</div>
            <div className="pm-flashcard-quiz-content">
              {parsedCards[currentIndex]?.answer}
            </div>
          </div>
        </div>
        <div className="pm-flashcard-quiz-nav">
          <button onClick={prevCard} className="pm-flashcard-quiz-btn">← Previous</button>
          <button 
            className="pm-flashcard-open-btn"
            onClick={() => handleOpenNewTab(parsedCards[currentIndex])}
          >
            Open in new tab
          </button>
          <button onClick={nextCard} className="pm-flashcard-quiz-btn">Next →</button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardViewer;
