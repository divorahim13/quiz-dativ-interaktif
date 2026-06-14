import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const QuizCard = React.memo(({ 
  currentQuestion, 
  progress, 
  isAnswered, 
  selectedOption, 
  handleOptionClick, 
  handleNext, 
  currentIdx, 
  totalQuestions 
}) => {
  return (
    <motion.div
      key="quiz"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={`feedback-area ${selectedOption === currentQuestion.correct ? 'feedback-success' : 'feedback-error'}`}
          >
            <strong>{selectedOption === currentQuestion.correct ? 'Richtig! ✨' : 'Leider falsch...'}</strong>
            <p style={{ marginBottom: '0.75rem' }}>{currentQuestion.explanation}</p>
            {currentQuestion.translation && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                <strong>Artinya:</strong> {currentQuestion.translation}
              </div>
            )}
            {currentQuestion.vocabulary && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', opacity: 0.8, color: 'var(--primary)' }}>
                <strong>Wortschatz:</strong> {currentQuestion.vocabulary}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isAnswered && (
        <button onClick={handleNext} className="next-btn">
          {currentIdx + 1 === totalQuestions ? 'Hasil Akhir' : 'Lanjut'} <ArrowRight size={20} style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
        </button>
      )}
    </motion.div>
  );
});

export default QuizCard;
