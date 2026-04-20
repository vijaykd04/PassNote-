import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { predictQuestions, predictQuestionsFromImage } from '../services/api'

const probConfig = {
  High:   { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-400/30',    label: '🔴 High' },
  Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-400/30', label: '🟡 Medium' },
  Low:    { color: 'text-green-400',  bg: 'bg-green-500/15 border-green-400/30', label: '🟢 Low' },
}

const MODES = {
  pdf: {
    label: 'PDF',
    icon: '📄',
    accept: 'application/pdf',
    maxMB: 10,
    formats: 'PDF only · Max 10 MB',
    emptyIcon: '📜',
    description: 'Upload your past year question paper PDF.',
    btnLabel: (l) => l ? '⏳ Predicting…' : '🔮 Predict Questions (5 💠)',
    loadingText: 'Analyzing question patterns and predicting future questions…',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    dropColor: 'rgba(6,182,212,0.8)',
    dropActive: 'rgba(6,182,212,0.5)',
    btnGradient: 'from-cyan-500 to-blue-600',
    dotColor: 'bg-cyan-500',
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    accept: 'image/jpeg,image/jpg,image/png,image/webp',
    maxMB: 5,
    formats: 'JPG · PNG · WEBP · Max 5 MB',
    emptyIcon: '📷',
    description: 'Upload a photo of a past year question paper.',
    btnLabel: (l) => l ? '⏳ Predicting…' : '🔮 Predict from Image (5 💠)',
    loadingText: 'PassNotes AI is reading your question paper photo…',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    dropColor: 'rgba(16,185,129,0.8)',
    dropActive: 'rgba(16,185,129,0.5)',
    btnGradient: 'from-emerald-500 to-teal-600',
    dotColor: 'bg-emerald-500',
  },
}

function QuestionPredictor() {
  const navigate = useNavigate()
  const { userData } = useSelector((s) => s.user)
  const credits = userData?.credits ?? 0

  const [mode, setMode] = useState('pdf')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const cfg = MODES[mode]

  const handleFile = (f) => {
    setError(''); setResult(null)
    if (!f) return
    const maxBytes = cfg.maxMB * 1024 * 1024
    if (mode === 'pdf' && f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    if (mode === 'image' && !['image/jpeg','image/jpg','image/png','image/webp'].includes(f.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.'); return
    }
    if (f.size > maxBytes) { setError(`File must be under ${cfg.maxMB} MB.`); return }
    setFile(f)
    if (mode === 'image') setPreviewUrl(URL.createObjectURL(f))
  }

  const switchMode = (m) => {
    setMode(m); setFile(null); setResult(null); setError(''); setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePredict = async () => {
    if (!file) { setError('Please upload a file first.'); return }
    if (credits < 5) { setError('Insufficient credits. You need at least 5 💠.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = mode === 'pdf' ? await predictQuestions(file) : await predictQuestionsFromImage(file)
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Prediction failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setFile(null); setResult(null); setError('')
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
  }

  const filteredQ = result?.predictedQuestions?.filter(q => filter === 'All' || q.probability === filter) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1528] to-[#0a0f1e] px-4 py-8 md:px-8">

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">PassNotes</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">🔮 Question Predictor — Analyze past papers and predict future questions</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale: 1.04 }} onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm cursor-pointer">
            <span>💠</span><span className="font-semibold">{credits}</span>
          </motion.div>
          <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
            ✏️ Generate Notes
          </motion.button>
        </div>
      </motion.header>

      {/* Upload Section */}
      {!result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
            {Object.entries(MODES).map(([key, m]) => (
              <motion.button key={key} onClick={() => switchMode(key)} whileHover={{ scale: 1.02 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200
                  ${mode === key ? 'bg-white/15 text-white shadow border border-white/20' : 'text-gray-400 hover:text-white'}`}>
                <span>{m.icon}</span><span>{m.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Info Banner */}
          <div className={`mb-6 rounded-2xl bg-gradient-to-r ${cfg.gradient} border ${cfg.border} p-4 flex items-start gap-3`}>
            <span className="text-2xl">🔮</span>
            <div>
              <p className="text-white font-semibold text-sm">AI Question Predictor</p>
              <p className="text-gray-300 text-xs mt-1">{cfg.description} PassNotes AI will analyze question patterns and predict what's likely to appear in your next exam.</p>
              <p className="text-cyan-300 text-xs mt-2 font-medium">⚡ Costs 5 💠 credits · {cfg.formats}</p>
            </div>
          </div>

          {/* Drop Zone */}
          <motion.div
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            animate={{ borderColor: dragging ? cfg.dropColor : file ? cfg.dropActive : 'rgba(255,255,255,0.1)', scale: dragging ? 1.01 : 1 }}
            className="rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[220px]">
            <input ref={fileInputRef} type="file" accept={cfg.accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 text-center">
                  <div className="text-5xl">{cfg.emptyIcon}</div>
                  <p className="text-white font-semibold">{dragging ? `Drop your ${cfg.label} here` : `Drag & drop your ${cfg.label}`}</p>
                  <p className="text-gray-400 text-sm">or click to browse · {cfg.formats}</p>
                </motion.div>
              ) : (
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center">
                  {mode === 'image' && previewUrl ? (
                    <div className="w-40 h-28 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.btnGradient} flex items-center justify-center text-3xl shadow-lg`}>📋</div>
                  )}
                  <div><p className="text-white font-semibold">{file.name}</p><p className="text-gray-400 text-xs mt-1">{(file.size/1024).toFixed(1)} KB</p></div>
                  <div className="flex gap-3 mt-1">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); handleReset() }}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-300 text-sm hover:bg-white/20 transition">✕ Remove</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); handlePredict() }} disabled={loading}
                      className={`px-6 py-2 rounded-lg bg-gradient-to-r ${cfg.btnGradient} text-white font-semibold text-sm shadow-lg disabled:opacity-60`}>
                      {cfg.btnLabel(loading)}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">⚠️ {error}</motion.div>}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 mt-10">
              <div className="flex gap-2">{[0,1,2,3,4].map(i => (
                <motion.div key={i} className={`w-3 h-3 rounded-full ${cfg.dotColor}`}
                  animate={{ scale:[1,1.6,1], opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.2, delay:i*0.15 }} />
              ))}</div>
              <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:2 }}
                className="text-gray-300 text-sm">{cfg.loadingText}</motion.p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results */}
      {result && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
          <div className={`rounded-2xl bg-gradient-to-r ${cfg.gradient} border ${cfg.border} px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div><p className="text-white font-semibold">{result.examName}</p><p className="text-gray-400 text-xs">{file?.name}</p></div>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} onClick={handleReset}
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
              {mode === 'pdf' ? '📜 Try Another Paper' : '📷 Try Another Image'}
            </motion.button>
          </div>

          {/* Top Topics + Pattern Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">🏆 Top Tested Topics</h3>
              <div className="space-y-2">
                {result.topTopics?.map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-cyan-400 font-bold w-5">#{i+1}</span>
                    <div className="flex-1 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center px-3">
                      <span className="text-sm text-gray-200">{t}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">💡 Pattern Insights</h3>
              <ul className="space-y-2">
                {result.patternInsights?.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-cyan-400 mt-0.5 flex-shrink-0">▸</span>{insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Topic Weightage Chart */}
          {result.topicWeightage?.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-5">📊 Topic Weightage (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.topicWeightage} margin={{ top:5, right:20, left:-10, bottom:60 }}>
                  <XAxis dataKey="topic" tick={{ fill:'#9ca3af', fontSize:11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
                  <Tooltip contentStyle={{ background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} cursor={{ fill:'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="percentage" radius={[6,6,0,0]}>
                    {result.topicWeightage.map((_, i) => (
                      <Cell key={i} fill={['#06b6d4','#3b82f6','#8b5cf6','#ec4899','#f59e0b','#10b981','#ef4444'][i%7]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Predicted Questions */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="text-white font-semibold">🔮 Predicted Questions ({result.predictedQuestions?.length})</h3>
              <div className="flex gap-2 flex-wrap">
                {['All','High','Medium','Low'].map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filter === f ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'}`}>
                    {f==='High'?'🔴':f==='Medium'?'🟡':f==='Low'?'🟢':''} {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {filteredQ.map((q, i) => {
                const c = probConfig[q.probability] ?? probConfig.Medium
                return (
                  <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                    className={`rounded-xl border p-4 ${c.bg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-gray-100 text-sm leading-relaxed flex-1">{q.question}</p>
                      <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border font-medium ${c.bg} ${c.color}`}>{c.label}</span>
                    </div>
                    <div className="flex gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">📌 {q.topic}</span>
                      <span className="text-xs text-gray-400">📝 {q.type}</span>
                      <span className="text-xs text-gray-500 italic">"{q.basis}"</span>
                    </div>
                  </motion.div>
                )
              })}
              {filteredQ.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No {filter} probability questions found.</p>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default QuestionPredictor
