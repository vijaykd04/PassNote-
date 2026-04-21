import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
const serverUrl = import.meta.env.VITE_SERVER_URL

// ─── Config ───────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code:'en-US', label:'English',    flag:'🇺🇸', groq:'English' },
  { code:'hi-IN', label:'Hindi',      flag:'🇮🇳', groq:'Hindi' },
  { code:'es-ES', label:'Spanish',    flag:'🇪🇸', groq:'Spanish' },
  { code:'fr-FR', label:'French',     flag:'🇫🇷', groq:'French' },
  { code:'de-DE', label:'German',     flag:'🇩🇪', groq:'German' },
  { code:'pt-BR', label:'Portuguese', flag:'🇧🇷', groq:'Portuguese' },
  { code:'ar-SA', label:'Arabic',     flag:'🇸🇦', groq:'Arabic' },
  { code:'ja-JP', label:'Japanese',   flag:'🇯🇵', groq:'Japanese' },
]

const TEACHERS = {
  female: {
    name: 'Nova',
    title: 'Ms. Nova',
    pronoun: 'her',
    greeting: 'Hi there! I\'m Nova, your AI teacher.',
    shirtColor: '#8b3f8f',
    shirtColor2: '#6a2f6e',
    hairColor: '#3d1a0e',
    eyeColor: '#6b3fa0',
    voiceHints: ['female','samantha','google us english','victoria','alice','zira','cortana','karen'],
    pitch: 1.15,
    rate: 0.92,
  },
  male: {
    name: 'Alex',
    title: 'Mr. Alex',
    pronoun: 'his',
    greeting: 'Hey! I\'m Alex, your AI teacher.',
    shirtColor: '#1e3a5f',
    shirtColor2: '#2c5282',
    hairColor: '#1a0f0a',
    eyeColor: '#3b5998',
    voiceHints: ['male','david','james','google uk english male','daniel','mark','aaron'],
    pitch: 0.88,
    rate: 0.93,
  },
}

const MODES = [
  { id:'explain', icon:'📖', label:'Lesson',  color:'from-blue-500 to-indigo-600' },
  { id:'doubt',   icon:'🤔', label:'Doubts',  color:'from-purple-500 to-pink-600' },
  { id:'test',    icon:'📝', label:'Test Me', color:'from-rose-500 to-orange-500' },
]

// ─── Emotions ─────────────────────────────────────────────────────────────────
const EMOTIONS = {
  praising:   { emoji:'🌟', label:'Praising!',  bg:'from-yellow-400 to-orange-400' },
  excited:    { emoji:'😃', label:'Excited!',   bg:'from-green-400 to-emerald-500' },
  thinking:   { emoji:'🤔', label:'Thinking…',  bg:'from-blue-400 to-indigo-500'   },
  explaining: { emoji:'💡', label:'Explaining', bg:'from-purple-400 to-violet-500' },
  curious:    { emoji:'✨', label:'Curious!',   bg:'from-cyan-400 to-blue-500'     },
  greeting:   { emoji:'👋', label:'Hello!',     bg:'from-pink-400 to-rose-500'     },
  empathetic: { emoji:'💙', label:'Got you',    bg:'from-sky-400 to-blue-500'      },
  testing:    { emoji:'📝', label:'Testing!',   bg:'from-amber-400 to-orange-500'  },
}

const detectEmotion = (text) => {
  const t = text.toLowerCase()
  if (/excellent|great job|correct|exactly right|well done|perfect|bravo/.test(t)) return 'praising'
  if (/amazing|fantastic|wonderful|incredible|awesome|wow/.test(t))                 return 'excited'
  if (/hmm|let me think|consider|ponder/.test(t))                                   return 'thinking'
  if (/hello|hi there|welcome|glad to|nice to meet/.test(t))                        return 'greeting'
  if (/sorry|not quite|incorrect|let me explain again/.test(t))                     return 'empathetic'
  if (/did you know|fun fact|think about|imagine|interesting/.test(t))              return 'curious'
  if (/question|next question|let's test|here's a/.test(t))                         return 'testing'
  return 'explaining'
}

// ─── Gestures ─────────────────────────────────────────────────────────────────
const GESTURES = {
  explaining: { rightArm:{ rotate:[0,-55,-45,-55,0] }, leftArm:{ rotate:[0,10,5,10,0] }, duration:2.5, repeat:Infinity },
  excited:    { rightArm:{ rotate:[0,-120,-110,-120,0] }, leftArm:{ rotate:[0,120,110,120,0] }, duration:1.2, repeat:Infinity },
  praising:   { rightArm:{ rotate:[0,-80,-70,-80,0] }, leftArm:{ rotate:[0,80,70,80,0] }, duration:1.0, repeat:3 },
  thinking:   { rightArm:{ rotate:[0,-95,-90,-95] }, leftArm:{ rotate:[0,5,3,5] }, duration:1.5, repeat:Infinity },
  greeting:   { rightArm:{ rotate:[0,-130,-110,-130,0] }, leftArm:{ rotate:[0,15,10,15,0] }, duration:0.8, repeat:3 },
  curious:    { rightArm:{ rotate:[0,-65,-55,-65,0] }, leftArm:{ rotate:[0,20,15,20,0] }, duration:2.0, repeat:Infinity },
  empathetic: { rightArm:{ rotate:[0,-30,-20,-30,0] }, leftArm:{ rotate:[0,30,20,30,0] }, duration:2.5, repeat:Infinity },
  testing:    { rightArm:{ rotate:[0,-60,-50,-65,0] }, leftArm:{ rotate:[0,10,5,10,0] }, duration:2.0, repeat:Infinity },
  idle:       { rightArm:{ rotate:[0,-5,0,-5,0] },     leftArm:{ rotate:[0,5,0,5,0] },   duration:3, repeat:Infinity },
}

// ─── TTS with gender voice ────────────────────────────────────────────────────
const speak = (text, langCode, teacher, onEnd) => {
  if (!window.speechSynthesis) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  const cfg = TEACHERS[teacher]
  utt.pitch = cfg.pitch
  utt.rate  = cfg.rate
  utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const lp = langCode.split('-')[0]
  // Try to find a gender-appropriate voice
  const genderVoice = voices.find(v =>
    v.lang.startsWith(lp) && cfg.voiceHints.some(h => v.name.toLowerCase().includes(h))
  )
  const langVoice = voices.find(v => v.lang === langCode) ||
    voices.find(v => v.lang.startsWith(lp) && v.name.includes('Google')) ||
    voices.find(v => v.lang.startsWith(lp))
  utt.voice = genderVoice || langVoice || voices[0]
  utt.onend = onEnd; utt.onerror = onEnd
  window.speechSynthesis.speak(utt)
}

// ─── FACE shared ─────────────────────────────────────────────────────────────
function Face({ speaking, emotion, blink, eyeColor, isFemale }) {
  const eyeSize   = emotion === 'excited' || emotion === 'greeting' ? 8 : 7
  const smileWide = ['praising','excited','greeting'].includes(emotion) ? 12 : ['empathetic','thinking'].includes(emotion) ? 7 : 10
  const eyebrowY  = emotion === 'thinking' ? -3 : emotion === 'excited' || emotion === 'praising' ? 3 : 0
  const browAngle = emotion === 'thinking' ? -12 : 0

  return (
    <div className="relative z-20 -mt-3 flex flex-col items-center"
      style={{
        background:'linear-gradient(160deg,#f7c5a0 0%,#e8a878 60%,#d4906e 100%)',
        borderRadius:'45% 45% 40% 40% / 38% 38% 52% 52%',
        width:'7.5rem', height:'8.5rem',
        boxShadow:'0 6px 18px rgba(0,0,0,0.25)'
      }}>

      {/* Eyebrows */}
      <div className="flex gap-6 mt-4 px-2">
        {[browAngle, -browAngle].map((angle,i) => (
          <motion.div key={i} animate={{ y:eyebrowY, rotate:angle }} transition={{ duration:0.5 }}
            className={`h-1.5 rounded-full ${isFemale ? 'w-7' : 'w-8'}`}
            style={{ background: isFemale ? '#5c2800' : '#2c1810', borderRadius:'3px 3px 0 0' }} />
        ))}
      </div>

      {/* Eyelashes (female only) */}
      {isFemale && (
        <div className="flex gap-5 mt-0.5 px-2">
          {[0,1].map(j => (
            <div key={j} className="flex gap-0.5">
              {[...Array(5)].map((_,k) => (
                <div key={k} style={{ width:'1px', height:'4px', background:'#3d1a0e', borderRadius:'1px', transform:`rotate(${(k-2)*8}deg)` }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Eyes */}
      <div className={`flex gap-5 ${isFemale ? 'mt-0.5' : 'mt-1.5'}`}>
        {[0,1].map(i => (
          <div key={i} className="relative bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden"
            style={{ width:`${eyeSize*4}px`, height:`${eyeSize*4}px` }}>
            <div className="rounded-full flex items-center justify-center relative"
              style={{ width:`${eyeSize*2.4}px`, height:`${eyeSize*2.4}px`, background:eyeColor }}>
              <div className="rounded-full bg-black" style={{ width:`${eyeSize*1.2}px`, height:`${eyeSize*1.2}px` }} />
              <div className="absolute top-0.5 right-0.5 rounded-full bg-white opacity-80" style={{ width:'5px', height:'5px' }} />
            </div>
            <motion.div animate={{ scaleY:blink?1:0 }} transition={{ duration:0.07 }}
              className="absolute inset-0 rounded-full origin-top" style={{ background:'#e8a878' }} />
          </div>
        ))}
      </div>

      {/* Nose */}
      <div className="mt-1.5 flex flex-col items-center opacity-60">
        <div className="w-0.5 h-4 border-r-2 rounded-full" style={{ borderColor:'#c07040' }} />
        <div className="flex gap-2 -mt-0.5">
          {[0,1].map(i => <div key={i} className="w-2 h-1 border-b-2 rounded-full" style={{ borderColor:'#c07040' }} />)}
        </div>
      </div>

      {/* Lips */}
      <div className="mt-1.5">
        {speaking ? (
          <motion.div animate={{ scaleY:[1,0.25,1,0.5,1.1,1], scaleX:[1,1.15,0.9,1.1,0.95,1] }}
            transition={{ repeat:Infinity, duration:0.4 }}
            className="relative overflow-hidden rounded-full"
            style={{ width:`${smileWide*3.5}px`, height:'16px', background: isFemale ? '#c0396e' : '#b03020' }}>
            <div className="absolute bottom-0 w-full h-1/2 opacity-50" style={{ background:'#e8a878' }} />
            <div className="absolute bottom-1 rounded-sm w-3/4 h-1.5 opacity-70" style={{ background:'#f5e8e0' }} />
          </motion.div>
        ) : (
          <motion.div animate={{ scaleX: ['praising','excited'].includes(emotion) ? [1,1.1,1] : 1 }}
            transition={{ repeat:Infinity, duration:1 }}
            style={{ width:`${smileWide*3.5}px`, height: isFemale ? '8px' : '7px', background: isFemale ? '#c0396e' : '#b03020', borderRadius:'0 0 10px 10px' }} />
        )}
      </div>

      {/* Ears */}
      <div className="absolute -left-2.5 top-9 w-3.5 h-5 rounded-l-full border-l" style={{ background:'#f7c5a0', borderColor:'#e0a070' }} />
      <div className="absolute -right-2.5 top-9 w-3.5 h-5 rounded-r-full border-r" style={{ background:'#f7c5a0', borderColor:'#e0a070' }} />

      {/* Female earrings */}
      {isFemale && (
        <>
          <div className="absolute -left-3 top-14 w-2.5 h-2.5 rounded-full" style={{ background:'#d4af37', boxShadow:'0 0 4px #d4af37' }} />
          <div className="absolute -right-3 top-14 w-2.5 h-2.5 rounded-full" style={{ background:'#d4af37', boxShadow:'0 0 4px #d4af37' }} />
        </>
      )}

      {/* Male glasses only */}
      {!isFemale && (
        <div className="absolute flex items-center gap-0.5" style={{ top:'34px' }}>
          <div className="w-7 h-5 rounded-full border-2 border-gray-500/60 bg-blue-100/5" />
          <div className="w-2 h-0.5 bg-gray-500/50" />
          <div className="w-7 h-5 rounded-full border-2 border-gray-500/60 bg-blue-100/5" />
        </div>
      )}
    </div>
  )
}

// ─── Teacher Avatar ───────────────────────────────────────────────────────────
function TeacherAvatar({ speaking, thinking, emotion, idle, teacher }) {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 120) }, 3200)
    return () => clearInterval(t)
  }, [])

  const isFemale = teacher === 'female'
  const cfg = TEACHERS[teacher]
  const gesture = thinking ? GESTURES.thinking : idle ? GESTURES.idle : GESTURES[emotion] ?? GESTURES.explaining

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Glow */}
      <motion.div animate={{ scale:speaking?[1,1.08,1]:1, opacity:speaking?[0.25,0.55,0.25]:0.15 }}
        transition={{ repeat:Infinity, duration:1.3 }}
        className={`absolute w-56 h-56 rounded-full blur-2xl top-0 pointer-events-none bg-gradient-to-r ${isFemale ? 'from-pink-400 to-purple-500' : 'from-blue-400 to-indigo-500'}`} />

      {/* Emotion badge */}
      <AnimatePresence mode="wait">
        {emotion && !idle && (
          <motion.div key={emotion} initial={{ opacity:0, y:-10, scale:0.8 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, scale:0.8 }}
            className={`absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${EMOTIONS[emotion]?.bg} shadow-lg whitespace-nowrap z-30`}>
            {EMOTIONS[emotion]?.emoji} {EMOTIONS[emotion]?.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <motion.div animate={{ y:speaking?[0,-3,0,-2,0]:idle?[0,-1,0]:[0,-2,0] }}
        transition={{ repeat:Infinity, duration:speaking?0.9:3 }}
        className="relative flex flex-col items-center z-10">

        {/* Hair */}
        {isFemale ? (
          <div className="relative z-20">
            {/* Female — long flowing hair */}
            <div className="w-32 h-10 rounded-t-full" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #5c2a10)` }} />
            {/* Side locks flowing down */}
            <div className="absolute -left-3 top-3 w-6 h-28 rounded-l-3xl" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #5c2a10)` }} />
            <div className="absolute -right-3 top-3 w-6 h-28 rounded-r-3xl" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #5c2a10)` }} />
            {/* Hair top volume */}
            <div className="absolute -top-1 left-4 right-4 h-6 rounded-t-full" style={{ background:cfg.hairColor }} />
          </div>
        ) : (
          <div className="relative z-20">
            {/* Male — short hair */}
            <div className="w-32 h-12 rounded-t-full" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #2c1810)` }} />
            <div className="absolute -left-2 top-4 w-5 h-14 rounded-l-full" style={{ background:cfg.hairColor }} />
            <div className="absolute -right-2 top-4 w-5 h-14 rounded-r-full" style={{ background:cfg.hairColor }} />
          </div>
        )}

        {/* Face */}
        <Face speaking={speaking} emotion={emotion} blink={blink} eyeColor={cfg.eyeColor} isFemale={isFemale} />

        {/* Neck */}
        <div className="-mt-0.5 w-9 h-5 z-10" style={{ background:'linear-gradient(to bottom, #e8a878, #d49060)' }} />

        {/* Torso + Arms */}
        <div className="relative flex items-start z-10" style={{ marginTop:'-2px' }}>

          {/* Left Arm */}
          <motion.div style={{ originX:'100%', originY:'0%' }} animate={gesture.leftArm}
            transition={{ duration:gesture.duration, repeat:gesture.repeat, ease:'easeInOut' }}
            className="relative flex flex-col items-end mt-1">
            <div className="w-5 h-12 rounded-full" style={{ background:`linear-gradient(to bottom, ${cfg.shirtColor}, ${cfg.shirtColor2})` }} />
            <div className="w-5 h-5 rounded-full -mt-1" style={{ background:cfg.shirtColor2 }} />
            <div className="w-4 h-10 rounded-full -mt-1" style={{ background:'linear-gradient(to bottom, #f7c5a0, #e8a878)' }} />
            <div className="w-5 h-5 rounded-full -mt-1" style={{ background:'#f7c5a0', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }} />
          </motion.div>

          {/* Torso */}
          <div className="relative flex flex-col items-center mx-1">
            <div className="w-28 rounded-b-2xl flex flex-col items-center pt-1"
              style={{ height:'64px', background:`linear-gradient(to bottom, ${cfg.shirtColor}, ${cfg.shirtColor2})` }}>
              {isFemale ? (
                <>
                  {/* Female — rounded neckline */}
                  <div className="w-12 h-6 rounded-b-full" style={{ background:'#f7c5a0', marginTop:'-2px' }} />
                  {/* Necklace */}
                  <div className="absolute top-5 flex gap-1">
                    {[...Array(5)].map((_,i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'#d4af37' }} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Male — shirt collar + tie */}
                  <div className="flex">
                    <div className="w-7 h-7 bg-white rounded-br-xl" />
                    <div className="w-1.5" style={{ background:'#d0d0d0' }} />
                    <div className="w-7 h-7 bg-white rounded-bl-xl" />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-12 rounded-b-lg"
                    style={{ background:'linear-gradient(to bottom, #c0392b, #922b21)' }} />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-3 rounded-sm"
                    style={{ background:'#e74c3c' }} />
                </>
              )}
            </div>
          </div>

          {/* Right Arm (main gesture arm) */}
          <motion.div style={{ originX:'0%', originY:'0%' }} animate={gesture.rightArm}
            transition={{ duration:gesture.duration, repeat:gesture.repeat, ease:'easeInOut' }}
            className="relative flex flex-col items-start mt-1">
            <div className="w-5 h-12 rounded-full" style={{ background:`linear-gradient(to bottom, ${cfg.shirtColor}, ${cfg.shirtColor2})` }} />
            <div className="w-5 h-5 rounded-full -mt-1" style={{ background:cfg.shirtColor2 }} />
            <div className="w-4 h-10 rounded-full -mt-1" style={{ background:'linear-gradient(to bottom, #f7c5a0, #e8a878)' }} />
            <div className="w-5 h-5 rounded-full -mt-1 relative" style={{ background:'#f7c5a0', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' }}>
              {['explaining','testing'].includes(emotion) && (
                <div className="absolute -right-1.5 top-1 w-2 h-1.5 rounded-r-full" style={{ background:'#f7c5a0' }} />
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Thinking bubble */}
      {thinking && (
        <div className="absolute -top-2 -right-4 flex gap-1">
          {[0,1,2].map(i => (
            <motion.div key={i} className="rounded-full bg-white/60"
              style={{ width:`${6+i*2}px`, height:`${6+i*2}px` }}
              animate={{ y:[0,-5,0], opacity:[0.5,1,0.5] }}
              transition={{ repeat:Infinity, duration:0.7, delay:i*0.15 }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AiTeacher() {
  const navigate = useNavigate()
  const location = useLocation()

  const [topicInput, setTopicInput] = useState(location.state?.topic || '')
  const [topic, setTopic] = useState(location.state?.topic || '')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [teacher, setTeacher] = useState('female')   // 'female' | 'male'
  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState('explain')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [emotion, setEmotion] = useState('explaining')
  const [idleEmotion, setIdleEmotion] = useState(true)

  const chatRef  = useRef(null)
  const recRef   = useRef(null)
  const timerRef = useRef(null)
  const msgRef   = useRef(messages)
  const modeRef  = useRef(mode)

  useEffect(() => { msgRef.current  = messages }, [messages])
  useEffect(() => { modeRef.current = mode },     [mode])
  useEffect(() => { window.speechSynthesis?.getVoices() }, [])
  useEffect(() => {
    if (started) timerRef.current = setInterval(() => setCallTime(t => t+1), 1000)
    return () => clearInterval(timerRef.current)
  }, [started])
  useEffect(() => { chatRef.current?.scrollTo({ top:chatRef.current.scrollHeight, behavior:'smooth' }) }, [messages])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const cfg = TEACHERS[teacher]

  const sendMessage = useCallback(async (text, overrideMode) => {
    if (!text?.trim() || loading) return
    setMessages(p => [...p, { role:'user', content:text }])
    setInput(''); setLoading(true); setIdleEmotion(false); setEmotion('thinking')
    try {
      const history = msgRef.current.map(m => ({ role:m.role, content:m.content }))
      const { data } = await axios.post(`${serverUrl}/api/ai-teacher/chat`, {
        topic, message:text, mode:overrideMode ?? modeRef.current, history, language:language.groq
      }, { withCredentials:true })
      const detected = detectEmotion(data.reply)
      setEmotion(detected)
      setMessages(p => [...p, { role:'assistant', content:data.reply, emotion:detected }])
      if (!muted) {
        setSpeaking(true)
        speak(data.reply, language.code, teacher, () => { setSpeaking(false); setIdleEmotion(true) })
      } else { setIdleEmotion(true) }
    } catch {
      setMessages(p => [...p, { role:'assistant', content:"Sorry, I had a connection issue!", emotion:'empathetic' }])
      setIdleEmotion(true)
    } finally { setLoading(false) }
  }, [loading, topic, language, teacher, muted])

  const startSession = () => {
    if (!topicInput.trim()) return
    setTopic(topicInput); setStarted(true); setMessages([]); setCallTime(0); setEmotion('greeting')
    setTimeout(() => sendMessage(`Hello! I'm ready to learn. Please start teaching me about ${topicInput}.`, 'explain'), 300)
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    sendMessage({ explain:`Let's continue the lesson on ${topic}.`, doubt:`I have doubts about ${topic}. Help me!`, test:`Quiz me on ${topic}. First question please!` }[newMode], newMode)
  }

  const toggleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Chrome.'); return }
    if (listening) { recRef.current?.stop(); setListening(false); return }
    const r = new SR()
    recRef.current = r; r.lang = language.code; r.interimResults = false
    r.onstart  = () => setListening(true)
    r.onresult = e => { const t = e.results[0][0].transcript; setInput(t); setListening(false); sendMessage(t) }
    r.onerror  = r.onend = () => setListening(false)
    r.start()
  }

  const endCall = () => {
    window.speechSynthesis?.cancel()
    setStarted(false); setMessages([]); setCallTime(0); setSpeaking(false); setListening(false)
  }

  const isFemale = teacher === 'female'

  // ── PRE-CALL ────────────────────────────────────────────────────────────────
  if (!started) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#0d1a35] to-[#0a0f1e] flex items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-lg rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">

        {/* Avatar preview */}
        <div className="flex justify-center mb-4 pt-4">
          <TeacherAvatar speaking={false} thinking={false} emotion="greeting" idle={false} teacher={teacher} />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-1">{cfg.name}</h1>
        <p className="text-gray-400 text-sm text-center mb-5">Your AI Teacher with gestures, voice & emotions</p>

        {/* GENDER SELECTOR */}
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">Choose your teacher</label>
          <div className="grid grid-cols-2 gap-3">
            {(['female','male']).map(g => {
              const t = TEACHERS[g]
              const isSelected = teacher === g
              return (
                <motion.button key={g} whileHover={{ scale:1.03 }} onClick={() => setTeacher(g)}
                  className={`py-4 rounded-2xl text-center transition border-2 ${isSelected
                    ? g === 'female' ? 'bg-pink-500/20 border-pink-400/80 text-white' : 'bg-blue-500/20 border-blue-400/80 text-white'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                  <div className="text-3xl mb-1">{g === 'female' ? '👩‍🏫' : '👨‍🏫'}</div>
                  <p className="font-bold text-sm">{t.title}</p>
                  <p className="text-xs opacity-60 mt-0.5">{g === 'female' ? 'Female voice' : 'Male voice'}</p>
                  {isSelected && <div className={`mt-1.5 text-xs font-semibold ${g === 'female' ? 'text-pink-300' : 'text-blue-300'}`}>✓ Selected</div>}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Topic */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-1 block">Topic to study</label>
          <input value={topicInput} onChange={e => setTopicInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startSession()}
            placeholder="e.g. Photosynthesis, Newton's Laws, World War II…"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 transition" />
        </div>

        {/* Language */}
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">Teaching language</label>
          <div className="grid grid-cols-4 gap-1.5">
            {LANGUAGES.map(lang => (
              <motion.button key={lang.code} whileHover={{ scale:1.05 }} onClick={() => setLanguage(lang)}
                className={`py-2 rounded-xl text-center text-xs transition border ${language.code === lang.code ? 'bg-blue-500/30 border-blue-400/60 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                <div className="text-lg">{lang.flag}</div>
                <div className="text-xs mt-0.5 truncate px-0.5">{lang.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Modes */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {MODES.map(m => (
            <div key={m.id} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <div className="text-xl mb-1">{m.icon}</div>
              <p className="text-white text-xs font-semibold">{m.label}</p>
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale:1.03 }} onClick={startSession} disabled={!topicInput.trim()}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg disabled:opacity-40 bg-gradient-to-r ${isFemale ? 'from-pink-500 to-purple-600' : 'from-blue-500 to-indigo-600'}`}>
          📹 Start with {cfg.title} · {language.flag}
        </motion.button>
        <button onClick={() => navigate(-1)} className="mt-3 w-full text-center text-gray-500 text-xs hover:text-white transition">← Go back</button>
      </motion.div>
    </div>
  )

  // ── LIVE CALL ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070711] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ repeat:Infinity, duration:1.5 }}
            className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-white text-xs font-bold tracking-widest">LIVE</span>
          </motion.div>
          <span className="text-gray-400 text-xs font-mono">{fmt(callTime)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            {isFemale ? '👩‍🏫' : '👨‍🏫'} {cfg.title}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{language.flag} {language.label}</span>
        </div>
        <p className="text-gray-400 text-xs truncate max-w-[180px]">📚 {topic}</p>
        <span className={`text-xs px-2 py-1 rounded-full border ${
          loading  ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300' :
          speaking ? 'bg-blue-500/20 border-blue-400/40 text-blue-300' :
                     'bg-green-500/20 border-green-400/40 text-green-300'
        }`}>{loading ? '💭 Thinking' : speaking ? '🔊 Speaking' : '👂 Ready'}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Teacher panel */}
        <div className={`flex flex-col items-center py-6 px-4 w-72 flex-shrink-0 border-r border-white/10 gap-5 overflow-y-auto bg-gradient-to-b ${isFemale ? 'from-[#1a0d22] to-[#07070f]' : 'from-[#0d0d22] to-[#07070f]'}`}>
          <div className="pt-8 pb-4">
            <TeacherAvatar speaking={speaking} thinking={loading} emotion={emotion} idle={idleEmotion} teacher={teacher} />
          </div>
          <div className="text-center -mt-2">
            <p className="text-white font-bold">{cfg.title}</p>
            <p className="text-gray-400 text-xs">{isFemale ? '👩 Female Teacher' : '👨 Male Teacher'} · {language.flag}</p>
          </div>

          {/* Mode switcher */}
          <div className="w-full space-y-2">
            <p className="text-gray-500 text-xs text-center uppercase tracking-wider">Switch Mode</p>
            {MODES.map(m => (
              <motion.button key={m.id} whileHover={{ scale:1.02 }} onClick={() => switchMode(m.id)}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition flex items-center gap-2 border
                  ${mode === m.id ? `bg-gradient-to-r ${m.color} text-white border-transparent` : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                <span>{m.icon}</span><span>{m.label}</span>
                {mode === m.id && <span className="ml-auto text-xs opacity-70">● Active</span>}
              </motion.button>
            ))}
          </div>

          {/* Student tile */}
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 h-20 flex flex-col items-center justify-center relative">
            <div className="text-3xl">🧑‍🎓</div>
            <p className="text-gray-400 text-xs">You</p>
            {listening && <span className="absolute top-2 right-2 text-xs text-red-400 animate-pulse">🎤</span>}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Right — Chat */}
        <div className="flex flex-col flex-1 bg-[#0b0b18]">
          <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 border ${
                    msg.role === 'assistant'
                      ? isFemale ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-400/30 text-white'
                                 : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/30 text-white'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}>
                    {msg.role === 'assistant' ? (isFemale ? '👩' : '👨') : '🧑'}
                  </div>
                  <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'assistant' ? 'bg-white/8 text-gray-100 rounded-tl-none border border-white/10' : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    {msg.content}
                    {msg.role === 'assistant' && msg.emotion && (
                      <span className="ml-2 text-xs opacity-40">{EMOTIONS[msg.emotion]?.emoji}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br border flex items-center justify-center ${isFemale ? 'from-pink-500 to-purple-600 border-pink-400/30' : 'from-blue-500 to-indigo-600 border-blue-400/30'}`}>
                  {isFemale ? '👩' : '👨'}
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/8 border border-white/10 flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-gray-400"
                      animate={{ y:[0,-5,0] }} transition={{ repeat:Infinity, duration:0.7, delay:i*0.15 }} />
                  ))}
                </div>
              </motion.div>
            )}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <div className="text-5xl">{isFemale ? '👩‍🏫' : '👨‍🏫'}</div>
                <p className="text-gray-400 text-sm">{cfg.title} will greet you shortly…</p>
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="flex gap-2 mb-2 flex-wrap">
              {MODES.map(m => (
                <button key={m.id} onClick={() => switchMode(m.id)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${mode === m.id ? 'bg-blue-500/30 border-blue-400 text-blue-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                  {m.icon} {m.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-600 self-center">{language.flag} {isFemale ? '👩' : '👨'}</span>
            </div>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale:1.05 }} onClick={toggleListen}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-base border flex-shrink-0 transition ${listening ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                {listening ? '🔴' : '🎤'}
              </motion.button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder={listening ? `Listening…` : `Ask ${cfg.name} anything in ${language.label}…`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-400 transition" />
              <motion.button whileHover={{ scale:1.05 }} disabled={!input.trim() || loading} onClick={() => sendMessage(input)}
                className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 text-base">➤</motion.button>
              <motion.button whileHover={{ scale:1.05 }} onClick={() => { setMuted(!muted); window.speechSynthesis?.cancel(); setSpeaking(false) }}
                className={`w-11 h-11 rounded-full border flex items-center justify-center text-base flex-shrink-0 transition ${muted ? 'bg-red-500/30 border-red-400/50 text-red-300' : 'bg-white/10 border-white/20'}`}>
                {muted ? '🔇' : '🔊'}
              </motion.button>
              <motion.button whileHover={{ scale:1.05 }} onClick={endCall}
                className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center flex-shrink-0 text-base">📵</motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
