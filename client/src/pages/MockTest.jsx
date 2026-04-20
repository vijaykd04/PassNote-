import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { generateMockTest as generateMockTestApi } from '../services/api'

const PdfUploadZone = ({ file, setFile, dragging, setDragging, fileInputRef, onAnalyze, loading }) => {
  const handleFile = (f) => {
    if (!f) return
    if (f.type !== 'application/pdf') return
    if (f.size > 10 * 1024 * 1024) return
    setFile(f)
  }
  return (
    <motion.div
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onClick={() => !file && fileInputRef.current?.click()}
      animate={{ borderColor: dragging ? 'rgba(234,179,8,0.8)' : file ? 'rgba(234,179,8,0.5)' : 'rgba(255,255,255,0.1)', scale: dragging ? 1.01 : 1 }}
      className="rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[220px]"
    >
      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 text-center">
            <div className="text-5xl">📄</div>
            <p className="text-white font-semibold">{dragging ? 'Drop your PDF here' : 'Drag & drop your subject PDF'}</p>
            <p className="text-gray-400 text-sm">or click to browse · PDF only · Max 10 MB</p>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-3xl shadow-lg">📋</div>
            <div>
              <p className="text-white font-semibold">{file.name}</p>
              <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <div className="flex gap-3 mt-1">
              <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); setFile(null) }} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-300 text-sm hover:bg-white/20 transition">✕ Remove</motion.button>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(234,179,8,0.5)' }} onClick={(e) => { e.stopPropagation(); onAnalyze() }} disabled={loading} className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-semibold text-sm shadow-lg disabled:opacity-60">
                {loading ? '⏳ Generating…' : '🧠 Generate Mock Test (5 💠)'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function MockTest() {
  const navigate = useNavigate()
  const { userData } = useSelector((s) => s.user)
  const credits = userData?.credits ?? 0
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [finished, setFinished] = useState(false)
  const fileInputRef = useRef(null)

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(''); setQuiz(null); setAnswers([]); setCurrent(0); setFinished(false)
    try {
      const res = await generateMockTestApi(file)
      setQuiz(res.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate mock test. Please try again.')
    } finally { setLoading(false) }
  }

  const handleSelect = (opt) => { if (selected) return; setSelected(opt); setShowExplanation(true) }

  const handleNext = () => {
    const q = quiz.questions[current]
    setAnswers(prev => [...prev, { id: q.id, selected, correct: q.correctAnswer }])
    if (current + 1 >= quiz.questions.length) { setFinished(true) }
    else { setCurrent(c => c + 1); setSelected(null); setShowExplanation(false) }
  }

  const handleReset = () => { setFile(null); setQuiz(null); setAnswers([]); setCurrent(0); setSelected(null); setShowExplanation(false); setFinished(false); setError('') }

  const score = answers.filter(a => a.selected === a.correct).length

  const optionColors = (opt) => {
    if (!selected) return 'bg-white/5 border-white/20 hover:bg-white/10 hover:border-yellow-400/50 cursor-pointer'
    const q = quiz.questions[current]
    if (opt === q.correctAnswer) return 'bg-green-500/20 border-green-400'
    if (opt === selected && opt !== q.correctAnswer) return 'bg-red-500/20 border-red-400'
    return 'bg-white/5 border-white/10 opacity-50'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f00] via-[#1f1200] to-[#1a0f00] px-4 py-8 md:px-8">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">PassNotes</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">📝 Mock Test Generator — Upload a PDF and take an AI-generated quiz</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale: 1.04 }} onClick={() => navigate('/pricing')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm cursor-pointer">
            <span>💠</span><span className="font-semibold">{credits}</span>
          </motion.div>
          <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/')} className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">✏️ Generate Notes</motion.button>
        </div>
      </motion.header>

      {/* Upload */}
      {!quiz && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 p-4 flex items-start gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="text-white font-semibold text-sm">AI Mock Test Generator</p>
              <p className="text-gray-300 text-xs mt-1">Upload any subject PDF and get 10 multiple-choice questions with answers and explanations.</p>
              <p className="text-yellow-300 text-xs mt-2 font-medium">⚡ Costs 5 💠 credits</p>
            </div>
          </div>
          <PdfUploadZone file={file} setFile={setFile} dragging={dragging} setDragging={setDragging} fileInputRef={fileInputRef} onAnalyze={handleAnalyze} loading={loading} />
          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">⚠️ {error}</motion.div>}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 mt-16">
          <div className="flex gap-2">{[0,1,2,3,4].map(i => <motion.div key={i} className="w-3 h-3 rounded-full bg-yellow-500" animate={{ scale: [1,1.6,1], opacity: [0.5,1,0.5] }} transition={{ repeat: Infinity, duration: 1.2, delay: i*0.15 }} />)}</div>
          <motion.p animate={{ opacity: [0.5,1,0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-gray-300 text-sm font-medium">PassNotes AI is reading your PDF and creating questions…</motion.p>
        </motion.div>
      )}

      {/* Finished */}
      {finished && quiz && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto text-center">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-10 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
            <div className="text-6xl mb-4">{score >= 8 ? '🏆' : score >= 5 ? '👍' : '📚'}</div>
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
            <p className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent mb-2">{score}/{quiz.totalQuestions}</p>
            <p className="text-gray-400 mb-8">{score >= 8 ? 'Excellent! You aced it!' : score >= 5 ? 'Good job! Keep practising.' : 'Keep studying — you can do it!'}</p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3"><p className="text-green-400 text-2xl font-bold">{score}</p><p className="text-gray-400 text-xs">Correct</p></div>
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3"><p className="text-red-400 text-2xl font-bold">{quiz.totalQuestions - score}</p><p className="text-gray-400 text-xs">Wrong</p></div>
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3"><p className="text-yellow-400 text-2xl font-bold">{Math.round(score / quiz.totalQuestions * 100)}%</p><p className="text-gray-400 text-xs">Score</p></div>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} onClick={handleReset} className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold">📄 Try Another PDF</motion.button>
          </div>
        </motion.div>
      )}

      {/* Quiz */}
      {quiz && !finished && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Question {current + 1} of {quiz.totalQuestions}</span>
              <span className="text-yellow-400 font-medium">{quiz.subject}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full" animate={{ width: `${((current) / quiz.totalQuestions) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">{quiz.questions[current].topic}</span>
              </div>
              <h3 className="text-white text-lg font-semibold mb-6 mt-3 leading-relaxed">{quiz.questions[current].question}</h3>

              <div className="space-y-3">
                {Object.entries(quiz.questions[current].options).map(([opt, text]) => (
                  <motion.button key={opt} whileHover={!selected ? { scale: 1.01 } : {}} onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-5 py-3 rounded-xl border transition-all duration-200 text-sm flex items-center gap-3 ${optionColors(opt)}`}>
                    <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full border border-current text-xs font-bold">{opt}</span>
                    <span className="text-gray-200">{text}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 p-4 rounded-xl border text-sm ${selected === quiz.questions[current].correctAnswer ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                    <p className="font-semibold mb-1">{selected === quiz.questions[current].correctAnswer ? '✅ Correct!' : `❌ Wrong! Correct answer: ${quiz.questions[current].correctAnswer}`}</p>
                    <p className="text-gray-300 text-xs">{quiz.questions[current].explanation}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {selected && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.03 }} onClick={handleNext}
                  className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold text-sm">
                  {current + 1 >= quiz.totalQuestions ? '🏁 Finish Quiz' : 'Next Question →'}
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export default MockTest
