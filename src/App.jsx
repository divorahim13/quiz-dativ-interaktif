import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizzes } from './data/quizData';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Languages, ArrowLeft } from 'lucide-react';
import QuizCard from './components/QuizCard';
import Dashboard from './components/Dashboard';

function App() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isQuizOver, setIsQuizOver] = useState(false);

  const currentQuestion = selectedQuiz?.questions[currentIdx];
  const progress = selectedQuiz ? ((currentIdx + 1) / selectedQuiz.questions.length) * 100 : 0;

  const handleSelectQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsQuizOver(false);
  };

  const handleOptionClick = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.correct) {
      setScore(s => s + 1);
    }
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
  };

  const goBackToDashboard = () => {
    setSelectedQuiz(null);
  };

  return (
    <div className="container">
      <AnimatePresence mode="wait">
        {!selectedQuiz ? (
          <Dashboard quizzes={quizzes} onSelectQuiz={handleSelectQuiz} />
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
            <Trophy size={64} color="#facc15" style={{ marginBottom: '1.5rem' }} />
            <h1>Latihan Selesai!</h1>
            <p className="subtitle">Luar biasa! Kamu telah menyelesaikan tantangan {selectedQuiz.title}.</p>
            
            <div className="score-circle">
              <div className="score-num">{score}</div>
              <div className="score-total">dari {selectedQuiz.questions.length}</div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={restartQuiz} className="next-btn" style={{ flex: 1, background: 'var(--glass)', border: '1px solid var(--glass-border)', marginTop: 0 }}>
                <RefreshCw size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Ulangi
              </button>
              <button onClick={goBackToDashboard} className="next-btn" style={{ flex: 1, marginTop: 0 }}>
                Menu Utama
              </button>
            </div>
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
