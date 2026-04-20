import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import MermaidSetup from './MermaidSetup'
import RechartSetUp from './RechartSetUp'
import { downloadPdf } from '../services/api'
import { useNavigate } from 'react-router-dom'

const markDownComponent = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-indigo-700 mt-6 mb-4 border-b pb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-semibold text-indigo-600 mt-5 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>,
  p:  ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
  ul: ({ children }) => <ul className="list-disc ml-6 space-y-1 text-gray-700">{children}</ul>,
  li: ({ children }) => <li className="marker:text-indigo-500">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-indigo-700">{children}</strong>,
}

function SectionHeader({ icon, title, color }) {
  const colors = {
    indigo: 'from-indigo-100 to-indigo-50 text-indigo-700',
    purple: 'from-purple-100 to-purple-50 text-purple-700',
    blue:   'from-blue-100 to-blue-50 text-blue-700',
    green:  'from-green-100 to-green-50 text-green-700',
    cyan:   'from-cyan-100 to-cyan-50 text-cyan-700',
    rose:   'from-rose-100 to-rose-50 text-rose-700',
    amber:  'from-amber-100 to-amber-50 text-amber-700',
    orange: 'from-orange-100 to-orange-50 text-orange-700',
  }
  return (
    <div className={`mb-4 px-4 py-2 rounded-lg bg-gradient-to-r ${colors[color] ?? colors.indigo} font-semibold flex items-center gap-2`}>
      <span>{icon}</span><span>{title}</span>
    </div>
  )
}

function FinalResult({ result, topic }) {
  const [quickRevision, setQuickRevision] = useState(false)
  const [openQ, setOpenQ] = useState(null)
  const navigate = useNavigate()

  if (!result || !result.subTopics || !result.questions?.short || !result.questions?.long || !result.revisionPoints) {
    return null
  }

  return (
    <div className="mt-6 p-3 space-y-10 bg-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📘 Generated Notes
        </h2>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setQuickRevision(!quickRevision)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${quickRevision ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
            {quickRevision ? '✕ Exit Revision Mode' : '⚡ Quick Revision (5 min)'}
          </button>
          <button onClick={() => downloadPdf(result)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
            ⬇️ Download PDF
          </button>
          <button
            onClick={() => navigate('/ai-teacher', { state: { topic: result?.topic ?? topic ?? 'this topic' } })}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 transition shadow-lg">
            🧑‍🏫 Start Live Session
          </button>
        </div>
      </div>

      {/* ══════════════ NORMAL MODE ══════════════ */}
      {!quickRevision && (
        <>
          {/* Sub Topics */}
          <section>
            <SectionHeader icon="⭐" title="Sub Topics by Priority" color="indigo" />
            {Object.entries(result.subTopics).map(([star, topics]) => (
              <div key={star} className="mb-3">
                <p className="font-medium text-indigo-600 mb-1">{star} Priority</p>
                <ul className="list-disc ml-6 text-gray-700">
                  {topics.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </section>

          {/* Detailed Notes */}
          <section>
            <SectionHeader icon="📝" title="Detailed Notes" color="purple" />
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <ReactMarkdown components={markDownComponent}>{result.notes}</ReactMarkdown>
            </div>
          </section>

          {/* Revision Points (also shown in normal mode) */}
          {result.revisionPoints?.length > 0 && (
            <section>
              <SectionHeader icon="📌" title="Key Revision Points" color="blue" />
              <ul className="space-y-2">
                {result.revisionPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <span className="text-blue-500 font-bold flex-shrink-0">▸</span>{p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Memory Tricks */}
          {result.memoryTricks?.length > 0 && (
            <section>
              <SectionHeader icon="🧠" title="Memory Tricks & Mnemonics" color="amber" />
              <div className="grid sm:grid-cols-2 gap-3">
                {result.memoryTricks.map((m, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="font-semibold text-amber-700 text-sm mb-1">💡 {m.trick}</p>
                    <p className="text-gray-600 text-xs">{m.explains}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Diagram */}
          {result.diagram?.data && (
            <section>
              <SectionHeader icon="📊" title="Concept Diagram" color="cyan" />
              <MermaidSetup diagram={result.diagram?.data} />
              <p className="mt-3 text-xs text-gray-500 italic">ℹ️ Take a screenshot to save this diagram for revision.</p>
            </section>
          )}

          {/* Charts */}
          {result.charts?.length > 0 && (
            <section>
              <SectionHeader icon="📈" title="Visual Charts" color="indigo" />
              <RechartSetUp charts={result.charts} />
              <p className="mt-3 text-xs text-gray-500 italic">ℹ️ Take a screenshot to save these charts for revision.</p>
            </section>
          )}

          {/* Practice Q&A */}
          {result.practiceQuestions?.length > 0 && (
            <section>
              <SectionHeader icon="🎯" title="Self-Test Practice Questions" color="rose" />
              <p className="text-sm text-gray-500 mb-4">Click a question to reveal the answer.</p>
              <div className="space-y-3">
                {result.practiceQuestions.map((pq, i) => (
                  <div key={i} className="rounded-xl border border-rose-200 overflow-hidden">
                    <button onClick={() => setOpenQ(openQ === i ? null : i)}
                      className="w-full text-left px-4 py-3 bg-rose-50 hover:bg-rose-100 transition text-sm font-medium text-rose-800 flex justify-between items-center">
                      <span>Q{i + 1}: {pq.question}</span>
                      <span className="text-rose-400 flex-shrink-0 ml-2">{openQ === i ? '▲' : '▼'}</span>
                    </button>
                    {openQ === i && (
                      <div className="px-4 py-3 bg-white text-sm text-gray-700 border-t border-rose-100">
                        <span className="font-medium text-rose-600">Answer: </span>{pq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Important Questions */}
          <section>
            <SectionHeader icon="❓" title="Important Exam Questions" color="rose" />
            <p className="font-medium text-gray-700 mb-2">Short Answer Questions:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1 mb-4">
              {result.questions.short.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
            <p className="font-medium text-gray-700 mb-2">Long Answer Questions:</p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1 mb-4">
              {result.questions.long.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
            {result.questions.diagram && (
              <>
                <p className="font-medium text-gray-700 mb-2">Diagram Question:</p>
                <ul className="list-disc ml-6 text-gray-700"><li>{result.questions.diagram}</li></ul>
              </>
            )}
          </section>
        </>
      )}

      {/* ══════════════ REVISION MODE ══════════════ */}
      {quickRevision && (
        <div className="space-y-6">

          {/* Quick Revision Points */}
          <section className="rounded-xl bg-gradient-to-r from-green-100 to-green-50 border border-green-200 p-6">
            <h3 className="font-bold text-green-700 mb-3 text-lg">⚡ Rapid-Fire Revision Points</h3>
            <ul className="space-y-2">
              {result.revisionPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-800 text-sm">
                  <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>{p}
                </li>
              ))}
            </ul>
          </section>

          {/* Memory Tricks in Revision Mode */}
          {result.memoryTricks?.length > 0 && (
            <section className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-6">
              <h3 className="font-bold text-amber-700 mb-4 text-lg">🧠 Memory Cheats</h3>
              <div className="space-y-3">
                {result.memoryTricks.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-amber-100">
                    <span className="text-2xl flex-shrink-0">💡</span>
                    <div>
                      <p className="font-bold text-amber-700 text-sm">{m.trick}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{m.explains}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Charts in Revision Mode */}
          {result.charts?.length > 0 && (
            <section className="rounded-xl bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-indigo-700 mb-4 text-lg">📊 Visual Reference Charts</h3>
              <RechartSetUp charts={result.charts} />
            </section>
          )}

          {/* Practice Q&A in Revision Mode */}
          {result.practiceQuestions?.length > 0 && (
            <section className="rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 p-6">
              <h3 className="font-bold text-rose-700 mb-4 text-lg">🎯 Quick Q&A Self-Test</h3>
              <div className="space-y-2">
                {result.practiceQuestions.map((pq, i) => (
                  <div key={i} className="rounded-lg border border-rose-200 overflow-hidden">
                    <button onClick={() => setOpenQ(openQ === i ? null : i)}
                      className="w-full text-left px-4 py-2.5 bg-white hover:bg-rose-50 transition text-sm font-medium text-rose-800 flex justify-between items-center">
                      <span>{pq.question}</span>
                      <span className="text-rose-400 flex-shrink-0 ml-2">{openQ === i ? '▲' : '▼'}</span>
                    </button>
                    {openQ === i && (
                      <div className="px-4 py-3 bg-rose-50 text-sm text-gray-700 border-t border-rose-100">
                        <span className="font-medium text-rose-600">✅ </span>{pq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Questions to Remember */}
          <section className="rounded-xl bg-white border border-gray-200 p-5">
            <h3 className="font-bold text-gray-700 mb-3 text-lg">❓ Must-Know Questions</h3>
            <div className="space-y-1">
              {result.questions.short.map((q, i) => (
                <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-rose-400 flex-shrink-0">▸</span>{q}
                </p>
              ))}
              {result.questions.long.map((q, i) => (
                <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-indigo-400 flex-shrink-0">▸</span>{q}
                </p>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default FinalResult
