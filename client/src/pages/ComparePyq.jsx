import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { comparePyq as comparePyqApi } from '../services/api'

const probConfig = {
  High:   { color: 'text-red-400',    bg: 'bg-red-500/15 border-red-400/30',    label: '🔴 High' },
  Medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-400/30', label: '🟡 Medium' },
  Low:    { color: 'text-green-400',  bg: 'bg-green-500/15 border-green-400/30', label: '🟢 Low' },
}

const CHART_COLORS = ['#f59e0b','#06b6d4','#8b5cf6','#ec4899','#10b981','#3b82f6','#ef4444']
const ACCEPTED = ['application/pdf','image/jpeg','image/jpg','image/png','image/webp']
const MAX_FILES = 5
const MIN_FILES = 2

function FileCard({ file, index, onRemove, preview }) {
  const isPdf = file.type === 'application/pdf'
  return (
    <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
      className="relative rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">{isPdf ? '📄' : '🖼️'}</span>
      {!isPdf && preview && (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
          <img src={preview} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{file.name}</p>
        <p className="text-gray-500 text-xs">{(file.size/1024).toFixed(0)} KB · Paper {index + 1}</p>
      </div>
      <motion.button whileHover={{ scale:1.15 }} onClick={() => onRemove(index)}
        className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs flex items-center justify-center hover:bg-red-500/40 transition flex-shrink-0">×</motion.button>
    </motion.div>
  )
}

function ComparePyq() {
  const navigate = useNavigate()
  const { userData } = useSelector(s => s.user)
  const credits = userData?.credits ?? 0

  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const fileInputRef = useRef(null)

  const cost = files.length * 2

  const addFiles = (newFiles) => {
    setError('')
    const valid = Array.from(newFiles).filter(f => {
      if (!ACCEPTED.includes(f.type)) { setError('Only PDF, JPG, PNG, or WEBP files allowed.'); return false }
      if (f.size > 10 * 1024 * 1024) { setError('Each file must be under 10 MB.'); return false }
      return true
    })
    if (files.length + valid.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed.`); return
    }
    // Check type consistency
    const allTypes = [...files, ...valid]
    const hasImage = allTypes.some(f => f.type.startsWith('image/'))
    const hasPdf = allTypes.some(f => f.type === 'application/pdf')
    if (hasImage && hasPdf) { setError('Please upload either all PDFs or all images, not a mix.'); return }

    const newPreviews = valid.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
    setFiles(prev => [...prev, ...valid])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  const removeFile = (i) => {
    if (previews[i]) URL.revokeObjectURL(previews[i])
    setFiles(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleCompare = async () => {
    if (files.length < MIN_FILES) { setError(`Add at least ${MIN_FILES} papers to compare.`); return }
    if (credits < cost) { setError(`Need ${cost} 💠 credits (${files.length} papers × 2).`); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await comparePyqApi(files)
      setResult(res.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Comparison failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    previews.forEach(p => p && URL.revokeObjectURL(p))
    setFiles([]); setPreviews([]); setResult(null); setError('')
  }

  const filteredQ = result?.predictedQuestions?.filter(q => filter === 'All' || q.probability === filter) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#100820] via-[#180d2d] to-[#100820] px-4 py-8 md:px-8">

      {/* Header */}
      <motion.header initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="mb-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div onClick={() => navigate('/')} className="cursor-pointer inline-block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 bg-clip-text text-transparent">PassNotes</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">📊 PYQ Comparison — Upload multiple year papers and get cross-year predictions</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <motion.div whileHover={{ scale:1.04 }} onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm cursor-pointer">
            <span>💠</span><span className="font-semibold">{credits}</span>
          </motion.div>
          <motion.button whileHover={{ scale:1.04 }} onClick={() => navigate('/question-predictor')}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
            🔮 Single PYQ
          </motion.button>
          <motion.button whileHover={{ scale:1.04 }} onClick={() => navigate('/')}
            className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
            ✏️ Generate Notes
          </motion.button>
        </div>
      </motion.header>

      {!result && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="max-w-2xl mx-auto">

          {/* Info Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 flex items-start gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-white font-semibold text-sm">Multi-Year PYQ Comparison</p>
              <p className="text-gray-300 text-xs mt-1">Upload <strong className="text-amber-300">2–5 past year papers</strong> (all PDFs or all images). PassNotes AI compares all years together, finds recurring topics, and predicts the most likely questions for your next exam with much higher accuracy.</p>
              <p className="text-amber-300 text-xs mt-2 font-medium">⚡ Costs 2 💠 per paper · PDF only · Max 10 MB each</p>
            </div>
          </div>

          {/* Drop Zone */}
          <motion.div
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
            animate={{ borderColor: dragging ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.1)', scale: dragging ? 1.01 : 1 }}
            className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[160px]">
            <input ref={fileInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            <div className="text-4xl">{files.length >= MAX_FILES ? '✅' : '📁'}</div>
            <p className="text-white font-semibold text-sm">
              {files.length >= MAX_FILES ? 'Maximum files added' : files.length === 0 ? 'Drag & drop past year papers here' : `Add more papers (${files.length}/${MAX_FILES})`}
            </p>
            <p className="text-gray-400 text-xs">or click to browse · PDF, JPG, PNG, WEBP · Max 10 MB each</p>
          </motion.div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="mt-4 space-y-2">
                <p className="text-gray-400 text-xs mb-2">📋 {files.length} paper{files.length > 1 ? 's' : ''} added · Cost: <span className="text-amber-400 font-semibold">{cost} 💠</span></p>
                {files.map((f, i) => (
                  <FileCard key={`${f.name}-${i}`} file={f} index={i} onRemove={removeFile} preview={previews[i]} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compare Button */}
          {files.length >= MIN_FILES && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mt-5">
              <motion.button whileHover={{ scale:1.03, boxShadow:'0 0 30px rgba(245,158,11,0.4)' }} onClick={handleCompare} disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-base shadow-lg disabled:opacity-60 transition">
                {loading ? '⏳ Comparing…' : `📊 Compare ${files.length} Papers & Predict (${cost} 💠)`}
              </motion.button>
              <p className="text-center text-gray-500 text-xs mt-2">Comparing <strong className="text-white">{files.length}</strong> papers for cross-year pattern analysis</p>
            </motion.div>
          )}

          {files.length === 1 && (
            <p className="text-center text-amber-400/70 text-xs mt-4">Add 1 more paper to enable comparison</p>
          )}

          <AnimatePresence>
            {error && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="mt-4 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">⚠️ {error}</motion.div>}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-4 mt-10">
              <div className="flex gap-2">{[0,1,2,3,4].map(i => (
                <motion.div key={i} className="w-3 h-3 rounded-full bg-amber-500"
                  animate={{ scale:[1,1.6,1], opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:1.2, delay:i*0.15 }} />
              ))}</div>
              <motion.p animate={{ opacity:[0.5,1,0.5] }} transition={{ repeat:Infinity, duration:2 }}
                className="text-gray-300 text-sm text-center">Comparing {files.length} papers and finding cross-year patterns…</motion.p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results */}
      {result && !loading && (
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="max-w-4xl mx-auto space-y-6">

          {/* Result Header */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-white font-semibold">{result.examName} — {result.papersAnalyzed} papers compared</p>
                <p className="text-gray-400 text-xs">Cross-year analysis complete</p>
              </div>
            </div>
            <motion.button whileHover={{ scale:1.04 }} onClick={handleReset}
              className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/20 transition">
              📊 Compare New Papers
            </motion.button>
          </div>

          {/* 🔥 Hot Topics */}
          {result.hotTopics?.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-orange-500/30 p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">🔥 Hot Topics — Most Likely to Appear</h3>
              <div className="space-y-3">
                {result.hotTopics.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xl flex-shrink-0">{['🥇','🥈','🥉'][i] ?? '🔥'}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.topic}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{t.reason}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {t.years?.map((y, j) => <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">{y}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yearly Breakdown */}
          {result.yearlyBreakdown?.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">📅 Year-by-Year Breakdown</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.yearlyBreakdown.map((y, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <p className="text-amber-300 text-xs font-semibold mb-2">📄 {y.paper}</p>
                    <div className="flex flex-wrap gap-1">
                      {y.dominantTopics?.map((t, j) => <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{t}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Topics + Trend Analysis */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">🔄 Recurring Topics</h3>
              <div className="space-y-2">
                {result.recurringTopics?.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <span className="text-sm text-gray-200">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-4">📈 Trend Analysis</h3>
              <ul className="space-y-2">
                {result.trendAnalysis?.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Topic Weightage Chart */}
          {result.topicWeightage?.length > 0 && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <h3 className="text-white font-semibold mb-5">📊 Cross-Year Topic Weightage (%)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={result.topicWeightage} margin={{ top:5, right:20, left:-10, bottom:60 }}>
                  <XAxis dataKey="topic" tick={{ fill:'#9ca3af', fontSize:11 }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill:'#9ca3af', fontSize:11 }} />
                  <Tooltip contentStyle={{ background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#fff' }} cursor={{ fill:'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="percentage" radius={[6,6,0,0]}>
                    {result.topicWeightage.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filter === f ? 'bg-amber-500/30 border-amber-400 text-amber-300' : 'bg-white/5 border-white/20 text-gray-400 hover:bg-white/10'}`}>
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
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="text-xs text-gray-400">📌 {q.topic}</span>
                      <span className="text-xs text-gray-400">📝 {q.type}</span>
                      {q.appearedInYears?.length > 0 && (
                        <span className="text-xs text-amber-400">📅 {q.appearedInYears.join(', ')}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 italic mt-1">"{q.basis}"</p>
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

export default ComparePyq
