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

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const updateChapterStreak = (chapterId) => {
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();
  
  const lastReviewStr = localStorage.getItem(`anki_${chapterId}_last_review_date`);
  let currentStreak = parseInt(localStorage.getItem(`anki_${chapterId}_streak`) || '0', 10);
  
  if (lastReviewStr === todayStr) {
    // Already reviewed today, keep streak
  } else if (lastReviewStr === yesterdayStr) {
    // Reviewed yesterday, increment streak
    currentStreak += 1;
  } else {
    // Broke streak or first time
    currentStreak = 1;
  }
  
  localStorage.setItem(`anki_${chapterId}_streak`, currentStreak.toString());
  localStorage.setItem(`anki_${chapterId}_last_review_date`, todayStr);
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

  // Anki Mode States
  const [viewMode, setViewMode] = useState('normal'); // 'normal' | 'anki'
  const [ankiSessionStarted, setAnkiSessionStarted] = useState(false);
  const [ankiCards, setAnkiCards] = useState([]);
  const [ankiCurrentIndex, setAnkiCurrentIndex] = useState(0);
  const [ankiCompletedCount, setAnkiCompletedCount] = useState(0);
  const [ankiTotalDueAtStart, setAnkiTotalDueAtStart] = useState(0);
  const [ankiIsFlipped, setAnkiIsFlipped] = useState(false);
  const [ankiRatingsCount, setAnkiRatingsCount] = useState({ Lagi: 0, Susah: 0, Oke: 0, Gampang: 0 });
  const [ankiSessionFinished, setAnkiSessionFinished] = useState(false);

  const startAnkiSession = () => {
    const due = [];
    const now = Date.now();
    
    // Find all due cards in chapter
    cards.forEach(card => {
      const key = `anki_${chapter.id}_${card.id}`;
      const stored = localStorage.getItem(key);
      let isDue = false;
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.nextReview <= now) {
            isDue = true;
          }
        } catch (e) {
          isDue = true;
        }
      } else {
        isDue = true; // new card is due immediately
      }
      
      if (isDue) {
        due.push(card);
      }
    });

    // Shuffle the due cards (standard for Anki review)
    const shuffledDue = [...due].sort(() => 0.5 - Math.random());

    setAnkiCards(shuffledDue);
    setAnkiCurrentIndex(0);
    setAnkiCompletedCount(0);
    setAnkiTotalDueAtStart(shuffledDue.length);
    setAnkiIsFlipped(false);
    setAnkiSessionStarted(true);
    setAnkiSessionFinished(false);
    setAnkiRatingsCount({ Lagi: 0, Susah: 0, Oke: 0, Gampang: 0 });
  };

  // Get Anki statistics for current chapter
  const getLocalAnkiStats = () => {
    let dueCount = 0;
    let learnedCount = 0;
    let newCount = 0;
    const now = Date.now();

    cards.forEach((card) => {
      const key = `anki_${chapter.id}_${card.id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.repetitions > 0) {
            learnedCount++;
            if (data.nextReview <= now) {
              dueCount++;
            }
          } else {
            newCount++;
            dueCount++;
          }
        } catch (e) {
          newCount++;
          dueCount++;
        }
      } else {
        newCount++;
        dueCount++;
      }
    });

    const streak = parseInt(localStorage.getItem(`anki_${chapter.id}_streak`) || '0', 10);

    return { dueCount, learnedCount, newCount, streak };
  };

  const ankiStats = getLocalAnkiStats();

  const getIntervalLabel = (card, rating) => {
    if (!card) return '';
    const key = `anki_${chapter.id}_${card.id}`;
    const stored = localStorage.getItem(key);
    let prevInterval = 0;
    let prevEase = 2.5;
    if (stored) {
      try {
        const data = JSON.parse(stored);
        prevInterval = data.interval || 0;
        prevEase = data.ease || 2.5;
      } catch (e) {}
    }

    if (rating === 'Oke') {
      return prevInterval === 0 ? 3 : Math.max(1, Math.round(prevInterval * prevEase));
    }
    if (rating === 'Gampang') {
      return prevInterval === 0 ? 7 : Math.max(1, Math.round(prevInterval * prevEase * 1.3));
    }
    return 1;
  };

  const handleAnkiRate = useCallback((rating) => {
    if (ankiCards.length === 0 || ankiCurrentIndex >= ankiCards.length) return;
    const card = ankiCards[ankiCurrentIndex];
    const key = `anki_${chapter.id}_${card.id}`;
    const stored = localStorage.getItem(key);
    
    let prevInterval = 0;
    let prevEase = 2.5;
    let prevRepetitions = 0;
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        prevInterval = data.interval || 0;
        prevEase = data.ease || 2.5;
        prevRepetitions = data.repetitions || 0;
      } catch (e) {}
    }

    let interval = 0;
    let ease = prevEase;
    let repetitions = prevRepetitions;
    let nextReview = Date.now();

    if (rating === 'Lagi') {
      interval = 0;
      repetitions = 0;
      nextReview = Date.now() + 60000; // 1 minute
      
      // Add card back to the end of the queue
      setAnkiCards(prev => [...prev, card]);
      setAnkiRatingsCount(prev => ({ ...prev, Lagi: prev.Lagi + 1 }));
    } else {
      repetitions += 1;
      if (rating === 'Susah') {
        interval = 1;
        ease = Math.max(1.3, prevEase - 0.15);
        nextReview = Date.now() + 1 * 24 * 60 * 60 * 1000;
        setAnkiRatingsCount(prev => ({ ...prev, Susah: prev.Susah + 1 }));
      } else if (rating === 'Oke') {
        interval = prevInterval === 0 ? 3 : Math.max(1, Math.round(prevInterval * prevEase));
        nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
        setAnkiRatingsCount(prev => ({ ...prev, Oke: prev.Oke + 1 }));
      } else if (rating === 'Gampang') {
        interval = prevInterval === 0 ? 7 : Math.max(1, Math.round(prevInterval * prevEase * 1.3));
        nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
        setAnkiRatingsCount(prev => ({ ...prev, Gampang: prev.Gampang + 1 }));
      }
      
      setAnkiCompletedCount(prev => prev + 1);
    }

    const itemData = {
      interval,
      nextReview,
      repetitions,
      ease,
      lastRating: rating
    };

    localStorage.setItem(key, JSON.stringify(itemData));

    // Move to next card
    setAnkiIsFlipped(false);
    
    // Check if session is finished
    if (ankiCurrentIndex + 1 >= ankiCards.length) {
      setAnkiSessionFinished(true);
      updateChapterStreak(chapter.id);
    } else {
      setAnkiCurrentIndex(prev => prev + 1);
    }
  }, [ankiCards, ankiCurrentIndex, chapter.id]);

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

      // Anki Mode Key Handling
      if (viewMode === 'anki') {
        if (ankiSessionStarted && !ankiSessionFinished) {
          if (!ankiIsFlipped) {
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Enter') {
              e.preventDefault();
              setAnkiIsFlipped(true);
            }
          } else {
            if (e.key === '1') handleAnkiRate('Lagi');
            if (e.key === '2') handleAnkiRate('Susah');
            if (e.key === '3') handleAnkiRate('Oke');
            if (e.key === '4') handleAnkiRate('Gampang');
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
            }
          }
        }
        return;
      }

      // Normal Mode Key Handling
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
  }, [
    handleNext,
    handlePrev,
    flipCard,
    hasCards,
    exerciseType,
    isQuizAnswered,
    quizOptions,
    handleSelectOption,
    viewMode,
    ankiSessionStarted,
    ankiSessionFinished,
    ankiIsFlipped,
    handleAnkiRate
  ]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '0.25rem',
          gap: '0.25rem',
          width: '100%',
          maxWidth: '480px',
          margin: '0 auto 1.5rem auto'
        }}>
          <button
            onClick={() => {
              setViewMode('normal');
              setIsFlipped(false);
            }}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: '16px',
              border: 'none',
              background: viewMode === 'normal' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'normal' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem'
            }}
          >
            📚 Mode Belajar Biasa
          </button>
          <button
            onClick={() => {
              setViewMode('anki');
              setAnkiSessionStarted(false);
              setAnkiSessionFinished(false);
            }}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: '16px',
              border: 'none',
              background: viewMode === 'anki' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'anki' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem'
            }}
          >
            ⚡ Mode Anki Review
          </button>
        </div>
      )}

      {viewMode === 'anki' ? (
        // ==========================================
        // ANKI MODE VIEWS
        // ==========================================
        !hasCards ? (
          <div className="glass-card empty-state" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <ImageIcon size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Belum ada Flashcard</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Materi untuk {chapter.title} sedang disiapkan.
            </p>
          </div>
        ) : ankiSessionFinished ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '500px', margin: '2rem auto' }}>
            <div className="glass-card" style={{ padding: '2.5rem 2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.4)', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                Sesi Selesai! 🎉
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem' }}>
                Kerja bagus! Kamu telah menyelesaikan review semua kartu due hari ini.
              </p>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '1.5rem',
                borderRadius: '16px',
                marginBottom: '2.5rem',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ringkasan Sesi</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>Total Kartu Di-review:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{ankiTotalDueAtStart}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#ef4444' }}>Lagi (Forgot):</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{ankiRatingsCount.Lagi}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#f97316' }}>Susah (Hard):</span>
                  <span style={{ fontWeight: 700, color: '#f97316' }}>{ankiRatingsCount.Susah}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#3b82f6' }}>Oke (Good):</span>
                  <span style={{ fontWeight: 700, color: '#3b82f6' }}>{ankiRatingsCount.Oke}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#22c55e' }}>Gampang (Easy):</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>{ankiRatingsCount.Gampang}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setAnkiSessionStarted(false);
                  setAnkiSessionFinished(false);
                }}
                style={{
                  width: '100%',
                  padding: '1rem 2rem',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 4px 14px -3px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                Kembali ke Menu Kapitel
              </button>
            </div>
          </div>
        ) : (ankiSessionStarted && currentAnkiCard) ? (
          <div className="flashcard-deck" style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
            {/* Sesi Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Sesi Review Anki</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {ankiCards.length - ankiCurrentIndex} kartu tersisa
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, progressPercent)}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </div>

            {/* Card Scene */}
            <div className="flashcard-scene" style={{ position: 'relative', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
              <motion.div 
                className="flashcard-inner"
                onClick={() => { if (!ankiIsFlipped) setAnkiIsFlipped(true); }}
                animate={{ rotateY: ankiIsFlipped ? 180 : 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ width: '100%', height: '100%' }}
              >
                {/* Front */}
                <div className="flashcard-front">
                  <div style={{ height: '20px' }}></div>
                  <div className="flashcard-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                      {studyMode === 'passive' ? 'Kosakata' : 'Arti'}
                    </span>
                    <h2 className="flashcard-title" style={{ 
                      fontSize: getAdaptiveFontSize(studyMode === 'passive' ? currentAnkiCard.front : currentAnkiCard.back, 'main')
                    }}>
                      {studyMode === 'passive' ? renderColorizedText(currentAnkiCard.front) : currentAnkiCard.back}
                    </h2>
                  </div>
                  <div className="flashcard-hint" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    Klik kartu atau spasi untuk melihat jawaban
                  </div>
                </div>

                {/* Back */}
                <div className="flashcard-back">
                  <div style={{ height: '20px' }}></div>
                  <div className="flashcard-content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                    <h2 className="flashcard-title flashcard-title-back" style={{ 
                      fontSize: getAdaptiveFontSize(studyMode === 'passive' ? currentAnkiCard.back : currentAnkiCard.front, 'main'),
                      color: studyMode === 'active' ? '#fff' : 'var(--primary)'
                    }}>
                      {studyMode === 'passive' ? currentAnkiCard.back : renderColorizedText(currentAnkiCard.front)}
                    </h2>
                    {currentAnkiCard.example && (
                      <div className="flashcard-example-container">
                        <div className="flashcard-example" style={{ 
                          fontSize: getAdaptiveFontSize(currentAnkiCard.example, 'example')
                        }}>
                          <div>"{currentAnkiCard.example}"</div>
                          {currentAnkiCard.example_id && (
                            <div className="flashcard-example-translation" style={{ 
                              fontSize: '0.85rem', 
                              color: 'var(--text-secondary)', 
                              marginTop: '0.5rem',
                              fontStyle: 'normal',
                              opacity: 0.8,
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                              paddingTop: '0.5rem'
                            }}>
                              {currentAnkiCard.example_id}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flashcard-hint" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    Pilih tingkat kesulitan untuk menjadwalkan review
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Rating / Action Buttons */}
            <div style={{ marginTop: '2rem', width: '100%' }}>
              {!ankiIsFlipped ? (
                <button
                  onClick={() => setAnkiIsFlipped(true)}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px -3px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Lihat Jawaban
                </button>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  width: '100%'
                }}>
                  <button
                    onClick={() => handleAnkiRate('Lagi')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#f87171',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Lagi</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>&lt; 1 mnt</span>
                  </button>

                  <button
                    onClick={() => handleAnkiRate('Susah')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      background: 'rgba(249, 115, 22, 0.08)',
                      color: '#fb923c',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Susah</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>1 hari</span>
                  </button>

                  <button
                    onClick={() => handleAnkiRate('Oke')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      background: 'rgba(59, 130, 246, 0.08)',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Oke</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{getIntervalLabel(currentAnkiCard, 'Oke')} hari</span>
                  </button>

                  <button
                    onClick={() => handleAnkiRate('Gampang')}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem 0.25rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      background: 'rgba(34, 197, 94, 0.08)',
                      color: '#4ade80',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Gampang</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{getIntervalLabel(currentAnkiCard, 'Gampang')} hari</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '560px', margin: '2rem auto' }}>
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(30, 41, 59, 0.4)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>⚡ Sesi Review Anki</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Gunakan sistem Spaced Repetition untuk mengingat kosakata lebih cepat dan efisien.
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem', 
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Hari Ini</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: ankiStats.dueCount > 0 ? '#ef4444' : '#22c55e', marginTop: '0.25rem' }}>{ankiStats.dueCount}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Streak Belajar</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#facc15', marginTop: '0.25rem' }}>{ankiStats.streak} hari 🔥</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dipelajari</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>{ankiStats.learnedCount}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kartu Baru</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '0.25rem' }}>{ankiStats.newCount}</div>
                </div>
              </div>

              {ankiStats.dueCount > 0 ? (
                <button
                  onClick={startAnkiSession}
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px -3px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Mulai Sesi Review
                </button>
              ) : (
                <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', color: '#4ade80', fontWeight: 600, fontSize: '0.95rem' }}>
                  🎉 Hebat! Semua kartu telah selesai di-review untuk hari ini.
                </div>
              )}
            </div>
          </div>
        )
      ) : (
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
                transition: 'background 0.25s ease, color 0.25s ease',
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
                transition: 'background 0.25s ease, color 0.25s ease',
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
                transition: 'background 0.25s ease, color 0.25s ease',
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
                transition: 'background 0.25s ease, color 0.25s ease',
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

      {viewMode === 'normal' && (
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
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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
                  duration: 0.15,
                  ease: [0.4, 0, 0.2, 1]
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
                            transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
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
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
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
