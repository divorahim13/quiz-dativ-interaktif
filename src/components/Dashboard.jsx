import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, ChevronRight, GraduationCap, Layers, ArrowLeft } from 'lucide-react';

const Dashboard = ({ quizzes, onSelectQuiz, flashcardLevels, onSelectChapter }) => {
  const [activeTab, setActiveTab] = useState('kuis'); // 'kuis' | 'flashcard'
  const [selectedLevel, setSelectedLevel] = useState(null); // 'A1' | 'A2' | 'B1' | 'B2'

  const activeFlashcardLevel = flashcardLevels?.find(l => l.id === selectedLevel);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="dashboard-container"
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <GraduationCap size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
        <h1>Deutsch Lernen</h1>
        <p className="subtitle">Pilih metode belajar untuk meningkatkan kemampuan bahasa Jerman Anda.</p>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button 
          onClick={() => { setActiveTab('kuis'); setSelectedLevel(null); }}
          className={`tab-btn ${activeTab === 'kuis' ? 'active' : ''}`}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'kuis' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'kuis' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={18} /> Grammatik Quiz
        </button>
        <button 
          onClick={() => setActiveTab('flashcard')}
          className={`tab-btn ${activeTab === 'flashcard' ? 'active' : ''}`}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'flashcard' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
            color: activeTab === 'flashcard' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={18} /> Wortschatz Flashcards
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kuis' && (
          <motion.div key="kuis" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="options-grid" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {quizzes.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => quiz.questions.length > 0 && onSelectQuiz(quiz)}
                  disabled={quiz.questions.length === 0}
                  className="option-btn glass-card"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    padding: '1.5rem',
                    opacity: quiz.questions.length === 0 ? 0.6 : 1,
                    cursor: quiz.questions.length === 0 ? 'not-allowed' : 'pointer',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'left'
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
        )}

        {activeTab === 'flashcard' && !selectedLevel && (
          <motion.div key="flashcard-levels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="options-grid" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {flashcardLevels?.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  className="option-btn glass-card"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    cursor: 'pointer',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ 
                    fontSize: '3rem', 
                    fontWeight: 800, 
                    color: 'var(--primary)',
                    marginBottom: '1rem',
                    textShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
                  }}>
                    {level.id}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {level.title}
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {level.description}
                  </p>
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    {level.chapters.length} Kapitel
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'flashcard' && selectedLevel && (
          <motion.div key="flashcard-chapters" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedLevel(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 style={{ margin: 0, color: 'var(--primary)' }}>{activeFlashcardLevel?.title}</h2>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '1rem' 
            }}>
              {activeFlashcardLevel?.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => onSelectChapter(chapter)}
                  className="glass-card chapter-btn"
                  style={{
                    padding: '1.5rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '12px'
                  }}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
                    {chapter.title.split(' ')[1]}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Kapitel
                  </span>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: chapter.cards.length > 0 ? '#22c55e' : 'var(--text-secondary)', opacity: 0.8 }}>
                    {chapter.cards.length} Kartu
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
