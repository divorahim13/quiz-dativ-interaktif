import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Image as ImageIcon } from 'lucide-react';

const FlashcardViewer = ({ chapter, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = chapter.cards || [];
  const hasCards = cards.length > 0;
  const currentCard = hasCards ? cards[currentIndex] : null;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const renderColorizedText = (text) => {
    if (!text) return null;
    
    // Split by comma if there are multiple parts (e.g. "die Bahn, -en")
    return text.split(',').map((part, index, array) => {
      let content = part;
      // Handle the first part which usually contains the article
      if (index === 0) {
        content = part.replace(/\b(der|die|das)\b/gi, (match) => {
          const lowerMatch = match.toLowerCase();
          let color = '';
          if (lowerMatch === 'der') color = '#3b82f6'; // blue
          if (lowerMatch === 'die') color = '#ef4444'; // red
          if (lowerMatch === 'das') color = '#22c55e'; // green
          return `<span style="color: ${color}; font-weight: 600;">${match}</span>`;
        });
      }
      
      const isLast = index === array.length - 1;
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: content }} />
          {!isLast && ','}
        </span>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flashcard-container"
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          onClick={onBack}
          className="back-btn"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'pointer',
            fontSize: '1rem',
            padding: 0
          }}
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        <h2 style={{ margin: '0 auto', fontSize: '1.25rem', color: 'var(--text)' }}>
          {chapter.title}
        </h2>
        <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
      </div>

      {!hasCards ? (
        <div className="glass-card empty-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ImageIcon size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Belum ada Flashcard</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Materi untuk {chapter.title} sedang disiapkan. Silakan tambahkan data flashcard nanti.
          </p>
        </div>
      ) : (
        <div className="flashcard-deck">
          <div className="progress-indicator" style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Kartu {currentIndex + 1} dari {cards.length}
          </div>

          <div className="flashcard-scene" onClick={flipCard}>
            <motion.div 
              className="flashcard-inner"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            >
              {/* Front of Card */}
              <div className="flashcard-front glass-card">
                {currentCard.image && (
                  <div className="flashcard-image-container">
                    <img src={currentCard.image} alt="flashcard" className="flashcard-image" />
                  </div>
                )}
                <div className="flashcard-content">
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>{renderColorizedText(currentCard.front)}</h2>
                </div>
                <div className="flashcard-hint">Klik untuk membalik kartu</div>
              </div>

              {/* Back of Card */}
              <div className="flashcard-back glass-card">
                <div className="flashcard-content">
                  <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '1rem' }}>
                    {currentCard.back}
                  </h2>
                  {currentCard.example && (
                    <div className="flashcard-example" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                      "{currentCard.example}"
                    </div>
                  )}
                </div>
                <div className="flashcard-hint">Klik untuk membalik kartu</div>
              </div>
            </motion.div>
          </div>

          <div className="flashcard-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2rem' }}>
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="control-btn"
              style={{
                background: currentIndex === 0 ? 'rgba(255,255,255,0.05)' : 'var(--glass)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === 0 ? 0.5 : 1,
                color: 'var(--text)'
              }}
            >
              <ChevronLeft size={24} />
            </button>
            
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="control-btn"
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--primary)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'var(--primary)'
              }}
            >
              <RefreshCw size={20} />
            </button>

            <button 
              onClick={handleNext} 
              disabled={currentIndex === cards.length - 1}
              className="control-btn"
              style={{
                background: currentIndex === cards.length - 1 ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: currentIndex === cards.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentIndex === cards.length - 1 ? 0.5 : 1,
                color: '#fff'
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FlashcardViewer;
