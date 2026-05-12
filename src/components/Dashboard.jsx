import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';

const Dashboard = ({ quizzes, onSelectQuiz }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <GraduationCap size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
        <h1>Pilih Latihan</h1>
        <p className="subtitle">Pilih modul kuis untuk memulai latihan bahasa Jerman Anda.</p>
      </div>

      <div className="options-grid" style={{ gap: '1.5rem' }}>
        {quizzes.map((quiz) => (
          <button
            key={quiz.id}
            onClick={() => quiz.questions.length > 0 && onSelectQuiz(quiz)}
            disabled={quiz.questions.length === 0}
            className="option-btn"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              padding: '1.5rem',
              opacity: quiz.questions.length === 0 ? 0.6 : 1,
              cursor: quiz.questions.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.75rem' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                background: 'rgba(99, 102, 241, 0.2)', 
                color: '#818cf8', 
                padding: '0.25rem 0.6rem', 
                borderRadius: '6px',
                fontWeight: 600
              }}>
                {quiz.difficulty}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <Calendar size={12} /> {quiz.date}
              </div>
            </div>
            
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              {quiz.title}
              <ChevronRight size={20} color="#6366f1" />
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
              {quiz.description}
            </p>

            {quiz.questions.length === 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#f87171', fontWeight: 500 }}>
                Modul belum tersedia
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
