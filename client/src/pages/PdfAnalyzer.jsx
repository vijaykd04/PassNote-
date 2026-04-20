import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import FinalResult from '../components/FinalResult'
import { analyzePdf, analyzeImage } from '../services/api'

const MODES = {
  pdf: {
    label: 'PDF',
    icon: '📄',
    accept: 'application/pdf',
    maxMB: 10,
    color: 'violet',
    gradient: 'from-violet-500/20 to-indigo-500/20',
    border: 'border-violet-500/30',
    btnGradient: 'from-violet-600 to-indigo-600',
    dotColor: 'bg-violet-500',
    dropColor: 'rgba(139, 92, 246, 0.8)',
    dropActive: 'rgba(139, 92, 246, 0.5)',
    description: 'Upload any study material, textbook chapter, or notes PDF.',
    btnLabel: (loading) => loading ? '⏳ Analyzing…' : '🚀 Analyze PDF (5 💠)',
    loadingText: 'PassNotes AI is reading your PDF and generating study notes…',
    formats: 'PDF only · Max 10 MB',
    emptyIcon: '📄',
  },
  image: {
    label: 'Image',
    icon: '🖼️',
    accept: 'image/jpeg,image/jpg,image/png,image/webp',
    maxMB: 5,
    color: 'emerald',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    btnGradient: 'from-emerald-600 to-teal-600',
    dotColor: 'bg-emerald-500',
    dropColor: 'rgba(16, 185, 129, 0.8)',
    dropActive: 'rgba(16, 185, 129, 0.5)',
    description: 'Upload a photo of handwritten notes, a whiteboard, or a textbook page.',
    btnLabel: (loading) => loading ? '⏳ Analyzing…' : '🚀 Analyze Image (5 💠)',
    loadingText: 'PassNotes AI is reading your image and generating study notes…',
    formats: 'JPG · PNG · WEBP · Max 5 MB',
    emptyIcon: '🖼️',
  },
}

function PdfAnalyzer() {
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)
  const credits = userData?.credits ?? 0

  const [mode, setMode] = useState('pdf')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [pageCount, setPageCount] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const cfg = MODES[mode]

  const handleFile = (f) => {
    setError(''); setResult(null)
    if (!f) return
    const maxBytes = cfg.maxMB * 1024 * 1024
    if (mode === 'pdf' && f.type !== 'application/pdf') {
      setError('Please upload a PDF file.'); return
    }
    if (mode === 'image' && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.'); return
    }
    if (f.size > maxBytes) {
      setError(`File must be under ${cfg.maxMB} MB.`); return
    }
    setFile(f)
    if (mode === 'image') {
      const url = URL.createObjectURL(f)
      setPreviewUrl(url)
    }
  }

  const switchMode = (m) => {
    setMode(m); setFile(null); setResult(null); setError('')
    setPreviewUrl(null); setPageCount(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [mode])

  const handleAnalyze = async () => {
    if (!file) { setError('Please upload a file first.'); return }
    if (credits < 5) { setError('Insufficient credits. You need at least 5 💠.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const response = mode === 'pdf'
        ? await analyzePdf(file)
        : await analyzeImage(file)
      setResult(response.data)
      setPageCount(response.pageCount ?? null)
    } catch (err) {
      setError(err?.response?.data?.message || 'Analysis failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setFile(null); setResult(null); setError(''); setPageCount(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1040] to-[#0f0c29] px-4 py-8 md:px-8">

      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">PassNotes</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">📄 Analyzer — Upload a PDF or Image and get smart study notes</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale: 1.04 }} onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm cursor-pointer">
            <span className="text-lg">💠</span><span className="font-semibold">{credits}</span>
            <span className="ml-1 text-xs text-gray-300">credits</span>
          </motion.div>
          <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/history')}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
            📚 Your Notes
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
            ✏️ Generate Notes
          </motion.button>
        </div>
      </motion.header>

      {/* Upload Section */}
      {!result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-2xl mx-auto">

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10">
            {Object.entries(MODES).map(([key, m]) => (
              <motion.button key={key} onClick={() => switchMode(key)} whileHover={{ scale: 1.02 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200
                  ${mode === key ? 'bg-white/15 text-white shadow border border-white/20' : 'text-gray-400 hover:text-white'}`}>
                <span>{m.icon}</span><span>{m.label}</span>
                {mode === key && <motion.span layoutId="tab-indicator" className="sr-only" />}
              </motion.button>
            ))}
          </div>

          {/* Info Banner */}
          <div className={`mb-6 rounded-2xl bg-gradient-to-r ${cfg.gradient} border ${cfg.border} p-4 flex items-start gap-3`}>
            <span className="text-2xl mt-0.5">{mode === 'pdf' ? '🧠' : '📷'}</span>
            <div>
              <p className="text-white font-semibold text-sm">{mode === 'pdf' ? 'AI-powered PDF Analysis' : 'AI-powered Image Analysis'}</p>
              <p className="text-gray-300 text-xs mt-1">{cfg.description} PassNotes AI will extract key concepts, revision points and exam questions.</p>
              <p className="text-xs mt-2 font-medium text-violet-300">⚡ Costs 5 💠 credits · {cfg.formats}</p>
            </div>
          </div>

          {/* Drop Zone */}
          <motion.div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => !file && fileInputRef.current?.click()}
            animate={{
              borderColor: dragging ? cfg.dropColor : file ? cfg.dropActive : 'rgba(255,255,255,0.1)',
              backgroundColor: dragging ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
              scale: dragging ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="relative rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[260px]">
            <input ref={fileInputRef} type="file" accept={cfg.accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 text-center">
                  <motion.div animate={{ y: dragging ? -8 : 0 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-5xl">
                    {cfg.emptyIcon}
                  </motion.div>
                  <p className="text-white font-semibold text-lg">{dragging ? `Drop your ${cfg.label} here` : `Drag & drop your ${cfg.label}`}</p>
                  <p className="text-gray-400 text-sm">or click to browse files</p>
                  <p className="text-gray-500 text-xs">{cfg.formats}</p>
                </motion.div>
              ) : (
                <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 text-center w-full">
                  {/* Image preview */}
                  {mode === 'image' && previewUrl ? (
                    <div className="w-40 h-28 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-4xl shadow-lg">📋</div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-base break-all max-w-xs">{file.name}</p>
                    <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); handleReset() }}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-gray-300 text-sm hover:bg-white/20 transition">
                      ✕ Remove
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); handleAnalyze() }} disabled={loading}
                      className={`px-6 py-2 rounded-lg bg-gradient-to-r ${cfg.btnGradient} text-white font-semibold text-sm shadow-lg disabled:opacity-60 transition`}>
                      {cfg.btnLabel(loading)}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  {[0,1,2,3,4].map(i => (
                    <motion.div key={i} className={`w-3 h-3 rounded-full ${cfg.dotColor}`}
                      animate={{ scale: [1,1.6,1], opacity: [0.5,1,0.5] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }} />
                  ))}
                </div>
                <motion.p animate={{ opacity: [0.5,1,0.5] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="text-gray-300 text-sm font-medium">{cfg.loadingText}</motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className={`mb-6 rounded-2xl bg-gradient-to-r ${cfg.gradient} border ${cfg.border} px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-white font-semibold">Analysis Complete!</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {file?.name}{pageCount ? ` · ${pageCount} page${pageCount !== 1 ? 's' : ''}` : ''}
                  </p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} onClick={handleReset}
                className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
                {mode === 'pdf' ? '📄 Analyze Another' : '🖼️ Analyze Another'}
              </motion.button>
            </div>
            <div className="rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6">
              <FinalResult result={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PdfAnalyzer
