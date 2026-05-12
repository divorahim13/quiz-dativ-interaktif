import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizData } from './data/quizData';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Languages } from 'lucide-react';
import QuizCard from './components/QuizCard';

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
          <QuizCard 
            currentQuestion={currentQuestion}
            progress={progress}
            isAnswered={isAnswered}
            selectedOption={selectedOption}
            handleOptionClick={handleOptionClick}
            handleNext={handleNext}
            currentIdx={currentIdx}
            totalQuestions={quizData.length}
          />
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
