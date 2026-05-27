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
  const [studyMode, setStudyMode] = useState('passive'); // 'passive' = German -> Indo, 'active' = Indo -> German
  const [tempInput, setTempInput] = useState('1');

  // Quiz Mode States
  const [exerciseType, setExerciseType] = useState('classic'); // 'classic' = card flip, 'quiz' = multiple choice
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);

  useEffect(() => {
    setTempInput(String(currentIndex + 1));
  }, [currentIndex]);

  const cards = chapter.cards || [];
  const hasCards = cards.length > 0;
  const currentCard = hasCards ? cards[currentIndex] : null;

  const correctText = studyMode === 'passive' ? (currentCard ? currentCard.back : '') : (currentCard ? currentCard.front : '');

  const handleInputChange = (e) => {
    const valueStr = e.target.value;
    setTempInput(valueStr);
    
    const val = parseInt(valueStr, 10);
    if (!isNaN(val) && val >= 1 && val <= cards.length) {
      setDirection(val - 1 > currentIndex ? 1 : -1);
      setIsFlipped(false);
      setCurrentIndex(val - 1);
    }
  };

  const handleInputBlur = () => {
    setTempInput(String(currentIndex + 1));
  };

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
    if (exerciseType === 'quiz') return;
    setIsFlipped((prev) => !prev);
  }, [exerciseType]);

  const handleSelectOption = useCallback((option) => {
    if (isQuizAnswered) return;
    setSelectedQuizOption(option);
    setIsQuizAnswered(true);
  }, [isQuizAnswered]);

  // Generate options when card changes, study mode changes, or exercise type changes
  useEffect(() => {
    if (!currentCard || !hasCards) return;

    const correct = studyMode === 'passive' ? currentCard.back : currentCard.front;

    // Filter out cards with same answer to avoid duplicate correct options
    const targetField = studyMode === 'passive' ? 'back' : 'front';
    const otherCards = cards.filter(c => c[targetField] !== correct);

    // Shuffle other cards and take 3
    const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3).map(c => c[targetField]);

    // Combine correct + distractors and shuffle
    const combined = [correct, ...distractors].sort(() => 0.5 - Math.random());

    setQuizOptions(combined);
    setSelectedQuizOption(null);
    setIsQuizAnswered(false);
  }, [currentIndex, studyMode, cards, currentCard, hasCards, exerciseType]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasCards) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();

      // Keyboard shortcuts for multiple choice quiz options
      if (exerciseType === 'quiz' && !isQuizAnswered) {
        if (e.key === '1' && quizOptions[0]) handleSelectOption(quizOptions[0]);
        if (e.key === '2' && quizOptions[1]) handleSelectOption(quizOptions[1]);
        if (e.key === '3' && quizOptions[2]) handleSelectOption(quizOptions[2]);
        if (e.key === '4' && quizOptions[3]) handleSelectOption(quizOptions[3]);
      }

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (exerciseType === 'quiz') return; // spacebar shouldn't flip in quiz mode
        e.preventDefault();
        flipCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, flipCard, hasCards, exerciseType, isQuizAnswered, quizOptions, handleSelectOption]);

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
        marginBottom: '1.5rem',
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

      {hasCards && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          {/* Active / Passive Recall Selector */}
          <div className="recall-mode-selector" style={{
            display: 'flex',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '0.35rem',
            gap: '0.35rem',
            width: '100%',
            maxWidth: '420px',
          }}>
            <button 
              onClick={() => { setStudyMode('passive'); setIsFlipped(false); }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: studyMode === 'passive' ? 'var(--primary)' : 'transparent',
                color: studyMode === 'passive' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🇩🇪 ➡️ 🇮🇩</span>
              <span>Passive Recall</span>
            </button>
            <button 
              onClick={() => { setStudyMode('active'); setIsFlipped(false); }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: studyMode === 'active' ? 'var(--primary)' : 'transparent',
                color: studyMode === 'active' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🇮🇩 ➡️ 🇩🇪</span>
              <span>Active Recall</span>
            </button>
          </div>

          {/* Exercise Type Selector: Classic Flip vs Multiple Choice */}
          <div className="recall-mode-selector" style={{
            display: 'flex',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '0.35rem',
            gap: '0.35rem',
            width: '100%',
            maxWidth: '420px',
          }}>
            <button 
              onClick={() => { setExerciseType('classic'); setIsFlipped(false); }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: exerciseType === 'classic' ? 'var(--primary)' : 'transparent',
                color: exerciseType === 'classic' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              🎴 Kartu Klasik
            </button>
            <button 
              onClick={() => { setExerciseType('quiz'); setIsFlipped(false); }}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                borderRadius: '12px',
                border: 'none',
                background: exerciseType === 'quiz' ? 'var(--primary)' : 'transparent',
                color: exerciseType === 'quiz' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              🎯 Pilihan Ganda
            </button>
          </div>
        </div>
      )}

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
          <div className="progress-indicator" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            marginBottom: '1.25rem', 
            color: 'var(--text-secondary)', 
            fontSize: '0.95rem' 
          }}>
            <span>Kartu</span>
            <input 
              type="number" 
              min={1} 
              max={cards.length} 
              value={tempInput} 
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              style={{
                width: '64px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--glass-border)',
                borderRadius: '10px',
                color: 'var(--text)',
                padding: '6px 8px',
                textAlign: 'center',
                fontWeight: '600',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => e.target.select()}
            />
            <span>dari {cards.length}</span>
          </div>

          <div className="flashcard-scene" style={{ 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'center', 
            overflow: exerciseType === 'quiz' ? 'visible' : 'hidden',
            height: exerciseType === 'quiz' ? 'auto' : undefined,
            minHeight: exerciseType === 'quiz' ? '460px' : undefined,
          }}>
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
                drag={exerciseType === 'quiz' ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={handleDragEnd}
                style={{ position: exerciseType === 'quiz' ? 'relative' : 'absolute', width: '100%', height: exerciseType === 'quiz' ? 'auto' : '100%', cursor: exerciseType === 'quiz' ? 'default' : 'grab' }}
                whileTap={exerciseType === 'quiz' ? {} : { cursor: 'grabbing' }}
              >
                {exerciseType === 'quiz' ? (
                  <div className="flashcard-front" style={{ position: 'relative', width: '100%', height: 'auto', display: 'flex', flexDirection: 'column', cursor: 'default' }}>
                    <div style={{ height: '10px' }}></div> {/* Top spacer */}
                    <div className="flashcard-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                        {studyMode === 'passive' ? 'Terjemahkan kata berikut:' : 'Pilih bahasa Jerman yang tepat:'}
                      </span>
                      <h2 className="flashcard-title" style={{ 
                        fontSize: getAdaptiveFontSize(studyMode === 'passive' ? currentCard.front : currentCard.back, 'main'),
                        marginBottom: '1rem'
                      }}>
                        {studyMode === 'passive' ? renderColorizedText(currentCard.front) : currentCard.back}
                      </h2>

                      {/* Options Grid */}
                      <div style={{ display: 'grid', gap: '0.65rem', width: '100%', marginTop: '0.5rem' }}>
                        {quizOptions.map((option, idx) => {
                          const isCorrect = option === correctText;
                          const isSelected = selectedQuizOption === option;

                          let btnStyle = {
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            color: 'var(--text)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          };

                          if (isQuizAnswered) {
                            if (isCorrect) {
                              btnStyle.borderColor = '#22c55e';
                              btnStyle.background = 'rgba(34, 197, 94, 0.12)';
                              btnStyle.color = '#4ade80';
                              btnStyle.fontWeight = 700;
                            } else if (isSelected) {
                              btnStyle.borderColor = '#ef4444';
                              btnStyle.background = 'rgba(239, 68, 68, 0.12)';
                              btnStyle.color = '#f87171';
                            }
                          }

                          return (
                            <motion.button
                              key={idx}
                              onClick={() => handleSelectOption(option)}
                              disabled={isQuizAnswered}
                              whileHover={!isQuizAnswered ? { y: -2, background: 'rgba(255, 255, 255, 0.08)', borderColor: 'var(--primary)' } : {}}
                              style={btnStyle}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: isQuizAnswered && isCorrect ? '#22c55e' : (isQuizAnswered && isSelected ? '#ef4444' : 'rgba(255,255,255,0.08)'),
                                  color: isQuizAnswered && (isCorrect || isSelected) ? '#fff' : 'var(--text-secondary)',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: 700
                                }}>
                                  {idx + 1}
                                </span>
                                {option}
                              </span>
                              {isQuizAnswered && isCorrect && (
                                <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 700 }}>Benar ✓</span>
                              )}
                              {isQuizAnswered && isSelected && !isCorrect && (
                                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>Salah ✗</span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Quiz Feedback and Translation / Example Sentence */}
                      {isQuizAnswered && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ marginTop: '1.25rem', width: '100%', textAlign: 'left' }}
                        >
                          <div style={{ 
                            color: selectedQuizOption === correctText ? '#4ade80' : '#f87171', 
                            fontWeight: 700, 
                            marginBottom: '0.5rem', 
                            fontSize: '0.95rem',
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px' 
                          }}>
                            {selectedQuizOption === correctText ? '✓ Luar biasa, jawabanmu betul!' : `✗ Kurang tepat. Jawaban yang benar adalah: "${correctText}"`}
                          </div>
                          
                          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>
                              <strong>Arti:</strong> {currentCard.back}
                            </p>
                            {currentCard.example && (
                              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                                <div style={{ fontStyle: 'italic', color: '#a5b4fc', fontSize: '0.9rem' }}>"{currentCard.example}"</div>
                                {currentCard.example_id && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{currentCard.example_id}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {!isQuizAnswered && (
                      <div className="flashcard-hint" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 'auto', position: 'relative', bottom: 0, paddingTop: '0.75rem' }}>
                        Tekan angka [1-4] pada keyboard untuk memilih cepat
                      </div>
                    )}
                  </div>
                ) : (
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
                        {currentCard.image && studyMode === 'passive' && (
                          <div className="flashcard-image-container">
                            <img src={currentCard.image} alt="flashcard" className="flashcard-image" />
                          </div>
                        )}
                        <h2 className="flashcard-title" style={{ 
                          fontSize: getAdaptiveFontSize(studyMode === 'passive' ? currentCard.front : currentCard.back, 'main')
                        }}>
                          {studyMode === 'passive' ? renderColorizedText(currentCard.front) : currentCard.back}
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
                          fontSize: getAdaptiveFontSize(studyMode === 'passive' ? currentCard.back : currentCard.front, 'main'),
                          color: studyMode === 'active' ? '#fff' : 'var(--primary)'
                        }}>
                          {studyMode === 'passive' ? currentCard.back : renderColorizedText(currentCard.front)}
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
                )}
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
              onClick={() => {
                if (exerciseType === 'quiz') {
                  setSelectedQuizOption(null);
                  setIsQuizAnswered(false);
                  const correct = studyMode === 'passive' ? currentCard.back : currentCard.front;
                  const targetField = studyMode === 'passive' ? 'back' : 'front';
                  const otherCards = cards.filter(c => c[targetField] !== correct);
                  const shuffledOthers = [...otherCards].sort(() => 0.5 - Math.random());
                  const distractors = shuffledOthers.slice(0, 3).map(c => c[targetField]);
                  const combined = [correct, ...distractors].sort(() => 0.5 - Math.random());
                  setQuizOptions(combined);
                } else {
                  setIsFlipped(!isFlipped);
                }
              }}
              className="control-btn"
              title={exerciseType === 'quiz' ? "Acak Pilihan Kembali" : "Balik Kartu"}
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
              <RefreshCw size={20} style={{ transform: isFlipped ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }} />
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
