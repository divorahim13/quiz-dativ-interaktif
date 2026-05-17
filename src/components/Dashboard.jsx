import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, BookOpen, Calendar, CheckCircle, ChevronRight, Clipboard, ClipboardCheck, Copy, Eraser, GraduationCap, Layers, ListPlus, Plus, Sparkles, Wand2, X, ArrowLeft } from 'lucide-react';

const FLASHCARD_TEMPLATE_SAMPLE = `die Tätigkeit, -en | kegiatan, aktivitas | Welche Tätigkeit machen Sie? | Pekerjaan apa yang Anda lakukan?
einen Termin einhalten | menepati janji/jadwal | Ich muss den Termin einhalten. | Saya harus menepati janji/jadwal.`;

const stripLineMarker = (line) => line
  .replace(/^\s*[-*•]\s+/, '')
  .replace(/^\s*\d+[.)\s-]+/, '')
  .trim();

const splitTemplateLine = (line) => {
  const spacedParts = line.split(/\s+\|\s+/).map((part) => part.trim());
  if (spacedParts.length >= 4) return spacedParts;
  return line.split('|').map((part) => part.trim());
};

const parseFlashcardTemplate = (rawText) => {
  const lines = rawText
    .replace(/```(?:\w+)?/g, '')
    .split('\n')
    .map(stripLineMarker)
    .filter(Boolean)
    .filter((line) => !/^front\s*\|/i.test(line) && !/^depan\s*\|/i.test(line));

  const seen = new Set();
  const cards = [];
  const invalidRows = [];

  lines.forEach((line, index) => {
    const parts = splitTemplateLine(line);

    if (parts.length < 4) {
      invalidRows.push({ line: index + 1, reason: 'Kolom kurang dari 4', value: line });
      return;
    }

    const [front, back, example, ...translationParts] = parts;
    const exampleId = translationParts.join(' | ').trim();

    if (!front || !back || !example || !exampleId) {
      invalidRows.push({ line: index + 1, reason: 'Ada kolom kosong', value: line });
      return;
    }

    const uniqueKey = `${front.toLowerCase()}::${back.toLowerCase()}`;
    if (seen.has(uniqueKey)) return;
    seen.add(uniqueKey);

    cards.push({
      front,
      back,
      example,
      example_id: exampleId,
    });
  });

  return { cards, invalidRows };
};

const buildAiTemplatePrompt = ({ level, chapter, count, source }) => {
  const material = source.trim() || `Kosakata baru untuk ${level} Kapitel ${chapter}`;

  return `Buat ${count} flashcard Wortschatz bahasa Jerman untuk ${level} Kapitel ${chapter}.

Gunakan template persis seperti ini:
front | back | example | example_id

Aturan:
- front: kata/frasa bahasa Jerman, sertakan artikel dan plural jika noun, atau bentuk penting jika verb.
- back: arti singkat dalam bahasa Indonesia.
- example: satu kalimat contoh bahasa Jerman yang natural dan sesuai level ${level}.
- example_id: terjemahan natural kalimat contoh ke bahasa Indonesia.
- Pakai delimiter " | " dengan spasi kiri-kanan.
- Keluarkan hanya baris data, tanpa nomor, tanpa tabel markdown, tanpa penjelasan.

Contoh format:
die Tätigkeit, -en | kegiatan, aktivitas | Welche Tätigkeit machen Sie? | Pekerjaan apa yang Anda lakukan?
einen Termin einhalten | menepati janji/jadwal | Ich muss den Termin einhalten. | Saya harus menepati janji/jadwal.

Materi/topik:
${material}`;
};

const Dashboard = ({ quizzes, onSelectQuiz, flashcardLevels, onSelectChapter, onAddFlashcards }) => {
  const [activeTab, setActiveTab] = useState('kuis'); // 'kuis' | 'flashcard'
  const [selectedLevel, setSelectedLevel] = useState(null); // 'A1' | 'A2' | 'B1' | 'B2'
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState('ai');
  const [inputText, setInputText] = useState('');
  const [aiSource, setAiSource] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [copyState, setCopyState] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedAddLevel, setSelectedAddLevel] = useState('A1');
  const [selectedAddChapter, setSelectedAddChapter] = useState('1');
  const parsedTemplate = parseFlashcardTemplate(inputText);
  const validPreviewCards = parsedTemplate.cards;

  const openAddModal = () => {
    setIsModalOpen(true);
    setFormError('');
    setCopyState('');
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    setFormError('');
    setCopyState('');
  };

  const handleBuildAiPrompt = () => {
    const prompt = buildAiTemplatePrompt({
      level: selectedAddLevel,
      chapter: selectedAddChapter,
      count: aiCount,
      source: aiSource,
    });
    setAiPrompt(prompt);
    setCopyState('');
  };

  const handleCopyPrompt = async () => {
    const prompt = aiPrompt || buildAiTemplatePrompt({
      level: selectedAddLevel,
      chapter: selectedAddChapter,
      count: aiCount,
      source: aiSource,
    });

    setAiPrompt(prompt);

    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('Prompt disalin');
    } catch {
      setCopyState('Tidak bisa menyalin otomatis');
    }
  };

  const handleUseTemplateSample = () => {
    setInputText(FLASHCARD_TEMPLATE_SAMPLE);
    setFormError('');
  };

  const handleClearTemplate = () => {
    setInputText('');
    setFormError('');
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setFormError('Template masih kosong.');
      return;
    }

    if (validPreviewCards.length > 0 && onAddFlashcards) {
      const chapterId = `${selectedAddLevel}-K${selectedAddChapter}`;
      const newCards = validPreviewCards.map((card, index) => ({
        id: `${chapterId}-custom-${index + 1}-${card.front.toLowerCase().replace(/\s+/g, '-')}`,
        ...card,
        source: addMode === 'ai' ? 'ai-template' : 'manual-template',
      }));
      onAddFlashcards(chapterId, newCards);
      closeAddModal();
      setInputText('');
      setAiSource('');
      setAiPrompt('');
    } else {
      setFormError('Belum ada baris valid sesuai template.');
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
                onClick={openAddModal}
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
                <Sparkles size={16} /> AI Tambah Wortschatz
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
          <div className="modal-backdrop">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card add-modal"
            >
              <button 
                onClick={closeAddModal}
                className="modal-close-btn"
                type="button"
                aria-label="Tutup"
              >
                <X size={24} />
              </button>

              <div className="add-modal-header">
                <div className="add-modal-icon">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2>Tambah Wortschatz</h2>
                  <p>{validPreviewCards.length} kartu siap disimpan</p>
                </div>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="add-form-grid">
                  <label className="form-field">
                    <span>Level</span>
                    <select 
                      value={selectedAddLevel} 
                      onChange={(e) => setSelectedAddLevel(e.target.value)}
                      className="form-control"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Kapitel</span>
                    <select 
                      value={selectedAddChapter} 
                      onChange={(e) => setSelectedAddChapter(e.target.value)}
                      className="form-control"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>Kapitel {i+1}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="add-mode-tabs" role="tablist" aria-label="Mode tambah wortschatz">
                  <button
                    type="button"
                    className={`add-mode-btn ${addMode === 'ai' ? 'active' : ''}`}
                    onClick={() => setAddMode('ai')}
                  >
                    <Wand2 size={16} /> AI Template
                  </button>
                  <button
                    type="button"
                    className={`add-mode-btn ${addMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setAddMode('manual')}
                  >
                    <ListPlus size={16} /> Manual
                  </button>
                </div>

                {addMode === 'ai' && (
                  <div className="ai-template-panel">
                    <div className="add-form-grid ai-grid">
                      <label className="form-field">
                        <span>Jumlah</span>
                        <input
                          value={aiCount}
                          onChange={(e) => setAiCount(Math.max(1, Number(e.target.value) || 1))}
                          type="number"
                          min="1"
                          max="50"
                          className="form-control"
                        />
                      </label>

                      <div className="ai-action-row">
                        <button type="button" className="secondary-btn" onClick={handleBuildAiPrompt}>
                          <Clipboard size={16} /> Buat Prompt
                        </button>
                        <button type="button" className="secondary-btn" onClick={handleCopyPrompt}>
                          {copyState === 'Prompt disalin' ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                          {copyState || 'Salin Prompt'}
                        </button>
                      </div>
                    </div>

                    <label className="form-field">
                      <span>Topik atau materi</span>
                      <textarea
                        value={aiSource}
                        onChange={(e) => setAiSource(e.target.value)}
                        placeholder="Contoh: kosakata A2 tentang Bahnhof, Arbeit, telefonieren, atau tempel daftar kata dari buku."
                        rows={3}
                        className="form-control textarea-control"
                      />
                    </label>

                    {aiPrompt && (
                      <label className="form-field">
                        <span>Prompt AI</span>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          rows={6}
                          className="form-control textarea-control prompt-output"
                        />
                      </label>
                    )}
                  </div>
                )}

                <div className="template-toolbar">
                  <div className="template-format">
                    front | back | example | example_id
                  </div>
                  <div className="template-actions">
                    <button type="button" className="icon-text-btn" onClick={handleUseTemplateSample}>
                      <ClipboardCheck size={15} /> Contoh
                    </button>
                    <button type="button" className="icon-text-btn" onClick={handleClearTemplate}>
                      <Eraser size={15} /> Bersihkan
                    </button>
                  </div>
                </div>

                <label className="form-field template-input-field">
                  <span>Template siap simpan</span>
                  <textarea 
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setFormError('');
                    }}
                    placeholder="der Apfel | apel | Ich esse einen Apfel. | Saya makan sebuah apel."
                    rows={7}
                    className="form-control textarea-control"
                  />
                </label>

                {(formError || parsedTemplate.invalidRows.length > 0) && (
                  <div className="form-alert">
                    <AlertCircle size={16} />
                    <span>
                      {formError || `${parsedTemplate.invalidRows.length} baris belum sesuai template.`}
                    </span>
                  </div>
                )}

                <div className="preview-panel">
                  <div className="preview-header">
                    <span>Preview</span>
                    <span className={`status-pill ${validPreviewCards.length > 0 ? 'ready' : ''}`}>
                      {validPreviewCards.length} valid
                    </span>
                  </div>

                  {validPreviewCards.length > 0 ? (
                    <div className="preview-list">
                      {validPreviewCards.slice(0, 4).map((card, index) => (
                        <div className="preview-card" key={`${card.front}-${index}`}>
                          <div className="preview-card-top">
                            <strong>{card.front}</strong>
                            <CheckCircle size={15} />
                          </div>
                          <p>{card.back}</p>
                          <small>{card.example} — {card.example_id}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-preview">
                      <Clipboard size={18} />
                      <span>Belum ada kartu valid</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="next-btn"
                  style={{ marginTop: '1rem' }}
                  disabled={validPreviewCards.length === 0}
                >
                  <Plus size={18} /> Simpan {validPreviewCards.length} Flashcard
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
