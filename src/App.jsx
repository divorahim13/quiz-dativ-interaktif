import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizData } from './data/quizData';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Trophy, ArrowRight, RefreshCw, Languages } from 'lucide-react';

function App() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuizOver, setIsQuizOver] = useState(false);

  const currentQuestion = quizData[currentIdx];
  const progress = ((currentIdx + 1) / quizData.length) * 100;

  const handleOptionClick = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.correct) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < quizData.length) {
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
  };

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        {!isQuizOver ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card"
          >
            <div className="level-badge">{currentQuestion.title}</div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="question-text">
              {currentQuestion.sentence.split('___').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="sentence-gap">
                      {isAnswered ? selectedOption : '?'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="options-grid">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                  className={`option-btn ${
                    selectedOption === option ? (option === currentQuestion.correct ? 'correct' : 'wrong') : 
                    (isAnswered && option === currentQuestion.correct ? 'correct' : '')
                  }`}
                >
                  {option}
                  {isAnswered && option === currentQuestion.correct && <CheckCircle2 size={20} />}
                  {isAnswered && selectedOption === option && option !== currentQuestion.correct && <XCircle size={20} />}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`feedback-area ${selectedOption === currentQuestion.correct ? 'feedback-success' : 'feedback-error'}`}
                >
                  <strong>{selectedOption === currentQuestion.correct ? 'Richtig! ✨' : 'Leider falsch...'}</strong>
                  <p>{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isAnswered && (
              <button onClick={handleNext} className="next-btn">
                {currentIdx + 1 === quizData.length ? 'Hasil Akhir' : 'Lanjut'} <ArrowRight size={20} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card result-card"
          >
            <Trophy size={64} color="#facc15" style={{ marginBottom: '1.5rem' }} />
            <h1>Latihan Selesai!</h1>
            <p className="subtitle">Luar biasa! Kamu telah menyelesaikan tantangan Dativ.</p>
            
            <div className="score-circle">
              <div className="score-num">{score}</div>
              <div className="score-total">dari {quizData.length}</div>
            </div>

            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
              {score === quizData.length ? "Perfekt! Kamu menguasai Dativ sepenuhnya! 🚀" : 
               score > 15 ? "Bagus sekali! Hampir sempurna. 💪" : "Terus belajar, kamu pasti bisa! 📖"}
            </p>

            <button onClick={restartQuiz} className="next-btn" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
              <RefreshCw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Coba Lagi
            </button>
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
