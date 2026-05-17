import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Image as ImageIcon } from 'lucide-react';

const getAdaptiveFontSize = (text, type = 'main') => {
  const length = String(text || '').length;

  if (type === 'example') {
    if (length > 90) return '0.95rem';
    if (length > 60) return '1rem';
    return '1.1rem';
  }

  if (length > 90) return '1.3rem';
  if (length > 65) return '1.55rem';
  if (length > 42) return '1.85rem';
  if (length > 26) return '2.15rem';
  return '2.6rem';
};

const FlashcardViewer = ({ chapter, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const cards = chapter.cards || [];
  const hasCards = cards.length > 0;
  const currentCard = hasCards ? cards[currentIndex] : null;

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [cards.length, currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasCards) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        flipCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, flipCard, hasCards]);

  const handleDragEnd = (e, { offset }) => {
    const swipe = offset.x;
    if (swipe < -100) {
      handleNext();
    } else if (swipe > 100) {
      handlePrev();
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    })
  };
  const renderColorizedText = (text) => {
    if (!text) return null;
    
    const lowerText = text.toLowerCase();
    let color = 'inherit';
    if (/\bder\b/i.test(lowerText)) color = '#3b82f6'; // blue
    else if (/\bdie\b/i.test(lowerText)) color = '#ef4444'; // red
    else if (/\bdas\b/i.test(lowerText)) color = '#22c55e'; // green

    return (
      <span style={{ color, fontWeight: color !== 'inherit' ? 700 : 'inherit' }}>
        {text}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flashcard-container"
    >
      <div className="flashcard-header" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        alignItems: 'center', 
        marginBottom: '2rem',
        width: '100%'
      }}>
        <button 
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0.5rem 0',
            justifySelf: 'start'
          }}
        >
          <ArrowLeft size={20} /> <span className="hide-mobile">Kembali</span>
        </button>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', margin: 0, textAlign: 'center' }}>
          {chapter.title}
        </h2>
        <div></div> {/* Empty div for grid balance */}
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

          <div className="flashcard-scene" style={{ position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.1,
                  ease: "linear"
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ position: 'absolute', width: '100%', height: '100%', cursor: 'grab' }}
                whileTap={{ cursor: 'grabbing' }}
              >
                <motion.div 
                  className="flashcard-inner"
                  onClick={flipCard}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.1, ease: "linear" }}
                  style={{ width: '100%', height: '100%' }}
                >
              {/* Front of Card */}
              <div className="flashcard-front">
                <div style={{ height: '20px' }}></div> {/* Top spacer */}
                <div className="flashcard-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                  {currentCard.image && (
                    <div className="flashcard-image-container">
                      <img src={currentCard.image} alt="flashcard" className="flashcard-image" />
                    </div>
                  )}
                  <h2 className="flashcard-title" style={{ 
                    fontSize: getAdaptiveFontSize(currentCard.front, 'main')
                  }}>
                    {renderColorizedText(currentCard.front)}
                  </h2>
                </div>
                <div className="flashcard-hint" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                  Klik atau spasi untuk membalik
                </div>
              </div>

              {/* Back of Card */}
              <div className="flashcard-back">
                <div style={{ height: '20px' }}></div> {/* Top spacer */}
                <div className="flashcard-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                  <h2 className="flashcard-title flashcard-title-back" style={{ 
                    fontSize: getAdaptiveFontSize(currentCard.back, 'main')
                  }}>
                    {renderColorizedText(currentCard.back)}
                  </h2>
                  {currentCard.example && (
                    <div className="flashcard-example-container">
                      <div className="flashcard-example" style={{ 
                        fontSize: getAdaptiveFontSize(currentCard.example, 'example')
                      }}>
                        <div>"{currentCard.example}"</div>
                        {currentCard.example_id && (
                          <div className="flashcard-example-translation" style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-secondary)', 
                            marginTop: '0.5rem',
                            fontStyle: 'normal',
                            opacity: 0.8,
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            paddingTop: '0.5rem'
                          }}>
                            {currentCard.example_id}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flashcard-hint" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                  Klik atau spasi untuk membalik
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
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
