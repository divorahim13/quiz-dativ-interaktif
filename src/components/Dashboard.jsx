import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, BookOpen, ChevronRight, GraduationCap, Layers, ArrowLeft, Plus, X } from 'lucide-react';

const Dashboard = ({ quizzes, onSelectQuiz, flashcardLevels, onSelectChapter, onAddFlashcards }) => {
  const [activeTab, setActiveTab] = useState('kuis'); // 'kuis' | 'flashcard'
  const [selectedLevel, setSelectedLevel] = useState(null); // 'A1' | 'A2' | 'B1' | 'B2'
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedAddLevel, setSelectedAddLevel] = useState('A1');
  const [selectedAddChapter, setSelectedAddChapter] = useState('1');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newCards = inputText.split('\n').map((line) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        return {
          id: Date.now() + Math.random(),
          front: parts[0],
          back: parts[1],
          example: parts[2] || ''
        };
      }
      return null;
    }).filter(Boolean);

    if (newCards.length > 0 && onAddFlashcards) {
      const chapterId = `${selectedAddLevel}-K${selectedAddChapter}`;
      onAddFlashcards(chapterId, newCards);
      setIsModalOpen(false);
      setInputText('');
    }
  };

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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <Plus size={16} /> Tambah Wortschatz
              </button>
            </div>
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

      {/* Add Wortschatz Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '2rem' }}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Tambah Wortschatz Baru</h2>
              <form onSubmit={handleAddSubmit}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Level</label>
                    <select 
                      value={selectedAddLevel} 
                      onChange={(e) => setSelectedAddLevel(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(30,41,59,0.9)', border: '1px solid var(--glass-border)', color: '#fff' }}
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kapitel</label>
                    <select 
                      value={selectedAddChapter} 
                      onChange={(e) => setSelectedAddChapter(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(30,41,59,0.9)', border: '1px solid var(--glass-border)', color: '#fff' }}
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>Kapitel {i+1}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Data Flashcard (Tiap baris: Depan | Belakang | Contoh)
                  </label>
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Contoh:&#10;der Apfel | Apel | Ich esse einen Apfel.&#10;die Banane | Pisang | Die Banane ist gelb."
                    rows={6}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                
                <button type="submit" className="next-btn" style={{ marginTop: 0 }}>
                  Simpan Flashcard
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
