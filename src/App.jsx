import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizzes } from './data/quizData';
import { flashcardLevels } from './data/flashcardData';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Languages, ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import QuizCard from './components/QuizCard';
import Dashboard from './components/Dashboard';
import FlashcardViewer from './components/FlashcardViewer';

function App() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedFlashcardChapter, setSelectedFlashcardChapter] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuizOver, setIsQuizOver] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showReview, setShowReview] = useState(false);

  // Custom Flashcards State
  const [customFlashcards, setCustomFlashcards] = useState(() => {
    try {
      const saved = localStorage.getItem('customFlashcards');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleAddCustomFlashcards = (chapterId, newCards) => {
    const updated = {
      ...customFlashcards,
      [chapterId]: [...(customFlashcards[chapterId] || []), ...newCards]
    };
    setCustomFlashcards(updated);
    localStorage.setItem('customFlashcards', JSON.stringify(updated));
  };

  const mergedFlashcardLevels = flashcardLevels.map(level => ({
    ...level,
    chapters: level.chapters.map(chapter => ({
      ...chapter,
      cards: [...chapter.cards, ...(customFlashcards[chapter.id] || [])]
    }))
  }));

  const currentQuestion = selectedQuiz?.questions[currentIdx];
  const progress = selectedQuiz ? ((currentIdx + 1) / selectedQuiz.questions.length) * 100 : 0;

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizOver(false);
    setUserAnswers([]);
    setShowReview(false);
  };

  const handleOptionClick = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correct;
    if (isCorrect) {
      setScore(s => s + 1);
    }

    setUserAnswers([...userAnswers, {
      question: currentQuestion,
      selected: option,
      isCorrect: isCorrect
    }]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < selectedQuiz.questions.length) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizOver(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#22c55e']
      });
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizOver(false);
    setUserAnswers([]);
    setShowReview(false);
  };

  const goBackToDashboard = () => {
    setSelectedQuiz(null);
    setSelectedFlashcardChapter(null);
  };

  return (
    <div className="container" style={{ maxWidth: showReview ? '800px' : '600px', transition: 'max-width 0.5s ease' }}>
      <AnimatePresence mode="wait">
        {!selectedQuiz && !selectedFlashcardChapter ? (
          <Dashboard 
            quizzes={quizzes} 
            onSelectQuiz={handleSelectQuiz} 
            flashcardLevels={mergedFlashcardLevels}
            onSelectChapter={setSelectedFlashcardChapter}
            onAddFlashcards={handleAddCustomFlashcards}
          />
        ) : selectedFlashcardChapter ? (
          <FlashcardViewer 
            key="flashcard-viewer"
            chapter={selectedFlashcardChapter} 
            onBack={() => setSelectedFlashcardChapter(null)} 
          />
        ) : !isQuizOver ? (
          <div key="quiz-container">
            <button 
              onClick={goBackToDashboard} 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '1rem', 
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={16} /> Kembali ke Dashboard
            </button>
            <QuizCard 
              currentQuestion={currentQuestion}
              progress={progress}
              isAnswered={isAnswered}
              selectedOption={selectedOption}
              handleOptionClick={handleOptionClick}
              handleNext={handleNext}
              currentIdx={currentIdx}
              totalQuestions={selectedQuiz.questions.length}
            />
          </div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card result-card"
          >
            {!showReview ? (
              <>
                <Trophy size={64} color="#facc15" style={{ marginBottom: '1.5rem' }} />
                <h1>Latihan Selesai!</h1>
                <p className="subtitle">Luar biasa! Kamu telah menyelesaikan tantangan {selectedQuiz.title}.</p>
                
                <div className="score-circle">
                  <div className="score-num">{score}</div>
                  <div className="score-total">dari {selectedQuiz.questions.length}</div>
                </div>

                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                  {score === selectedQuiz.questions.length ? "Perfekt! Kamu menguasai Dativ sepenuhnya! 🚀" : 
                   score > 15 ? "Bagus sekali! Hampir sempurna. 💪" : "Terus belajar, kamu pasti bisa! 📖"}
                </p>

                <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
                  <button onClick={() => setShowReview(true)} className="next-btn" style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                    Review Jawaban Salah
                  </button>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={restartQuiz} className="next-btn" style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--glass-border)', marginTop: 0 }}>
                      <RefreshCw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Ulangi
                    </button>
                    <button onClick={goBackToDashboard} className="next-btn" style={{ flex: 1, marginTop: 0 }}>
                      Menu Utama
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h1>Review Jawaban</h1>
                  <button onClick={() => setShowReview(false)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text)', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer' }}>
                    Tutup Review
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {userAnswers.map((ans, idx) => (
                    <div 
                      key={idx} 
                      className="glass-card" 
                      style={{ 
                        padding: '1.5rem', 
                        borderLeft: `4px solid ${ans.isCorrect ? '#22c55e' : '#ef4444'}`,
                        background: 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Soal {idx + 1}</span>
                        {ans.isCorrect ? <CheckCircle size={20} color="#22c55e" /> : <XCircle size={20} color="#ef4444" />}
                      </div>
                      
                      <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                        {ans.question.sentence.split('___').map((part, i, arr) => (
                          <React.Fragment key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span style={{ color: ans.isCorrect ? '#22c55e' : '#ef4444', fontWeight: 700, textDecoration: 'underline' }}>
                                {ans.selected}
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </p>

                      {!ans.isCorrect && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          <p style={{ color: '#f87171', marginBottom: '0.5rem', fontWeight: 600 }}>
                            Jawaban Benar: <span style={{ color: '#22c55e' }}>{ans.question.correct}</span>
                          </p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '0.5rem' }}>
                            <strong>Penjelasan:</strong> {ans.question.explanation}
                          </p>
                          {ans.question.translation && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0, opacity: 0.8 }}>
                              <strong>Artinya:</strong> {ans.question.translation}
                            </p>
                          )}
                          {ans.question.vocabulary && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0.4rem 0 0 0' }}>
                              <strong>Wortschatz:</strong> {ans.question.vocabulary}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {ans.isCorrect && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '0.5rem' }}>
                            <strong>Penjelasan:</strong> {ans.question.explanation}
                          </p>
                          {ans.question.translation && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text)', margin: 0, opacity: 0.8 }}>
                              <strong>Artinya:</strong> {ans.question.translation}
                            </p>
                          )}
                          {ans.question.vocabulary && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', margin: '0.4rem 0 0 0' }}>
                              <strong>Wortschatz:</strong> {ans.question.vocabulary}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={goBackToDashboard} className="next-btn" style={{ marginTop: '2rem' }}>
                  Kembali ke Menu Utama
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Languages size={14} /> Built for Ausbildung Preparation
      </div>
    </div>
  );
}

export default App;
