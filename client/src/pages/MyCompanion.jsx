import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
const serverUrl = "http://localhost:8000"

// ─── Companions ───────────────────────────────────────────────────────────────
const COMPANIONS = {
  blaze: {
    name: 'Blaze', title: '⚡ Blaze',
    subtitle: 'The Sarcastic Speedster',
    tagline: "Faster than your excuses, warmer than your coffee ☕",
    primary: '#e63946', secondary: '#ff6b35', glow: 'from-red-500 to-orange-500',
    bg: 'from-[#1a0505] to-[#0f0305]', accent: '#ff6b35',
    maskColor: '#c1121f', capeColor: '#e63946', emblem: '⚡',
    eyeColor: '#ff6b35', hairColor: '#1a0800',
    voiceHints: ['male','david','james','daniel','mark'],
    pitch: 0.9, rate: 1.0,
    intro: "Okay, okay — here I am. Your friendly neighborhood superhero. What's going on? And before you say 'nothing', remember: I can literally run faster than your problems. Talk to me! ⚡",
  },
  luna: {
    name: 'Luna', title: '🌙 Luna',
    subtitle: 'The Cosmic Cheerleader',
    tagline: "Powered by stardust & zero tolerance for bad vibes 🌟",
    primary: '#7b2d8b', secondary: '#a855f7', glow: 'from-purple-500 to-pink-500',
    bg: 'from-[#0d0514] to-[#070310]', accent: '#a855f7',
    maskColor: '#6d28d9', capeColor: '#7b2d8b', emblem: '🌙',
    eyeColor: '#a855f7', hairColor: '#1a0030',
    voiceHints: ['female','samantha','victoria','alice','zira'],
    pitch: 1.15, rate: 0.95,
    intro: "Hey! Luna here — your cosmic companion and certified bad-vibe destroyer. I've faced down meteors, I can handle whatever's going on with you. So... what's up? 🌙",
  },
}

const LANGUAGES = [
  { code:'en-US', label:'English', flag:'🇺🇸', groq:'English' },
  { code:'hi-IN', label:'Hindi',   flag:'🇮🇳', groq:'Hindi'   },
  { code:'es-ES', label:'Spanish', flag:'🇪🇸', groq:'Spanish' },
  { code:'fr-FR', label:'French',  flag:'🇫🇷', groq:'French'  },
  { code:'de-DE', label:'German',  flag:'🇩🇪', groq:'German'  },
  { code:'ja-JP', label:'Japanese',flag:'🇯🇵', groq:'Japanese'},
]

// ─── Emotion detection ────────────────────────────────────────────────────────
const EMOTIONS = {
  joking:      { emoji:'😂', label:'Cracking up!',  gesture:'joking'      },
  encouraging: { emoji:'💪', label:'You got this!', gesture:'encouraging' },
  sarcastic:   { emoji:'😏', label:'Really now…',   gesture:'sarcastic'   },
  empathetic:  { emoji:'🤗', label:'I feel you',     gesture:'empathetic'  },
  heroic:      { emoji:'🦸', label:'HERO MODE!',     gesture:'heroic'      },
  thinking:    { emoji:'🤔', label:'Processing…',    gesture:'thinking'    },
  excited:     { emoji:'🎉', label:'YO LET\'S GO!', gesture:'excited'     },
}

const detectEmotion = (text) => {
  const t = text.toLowerCase()
  if (/haha|lol|funny|joke|laugh|😂|😄|😆/.test(t))                        return 'joking'
  if (/you got|believe in|you can|come on|let's go|you're amazing|proud/.test(t)) return 'encouraging'
  if (/really|seriously|wow okay|sure|totally|obviously|right/.test(t))     return 'sarcastic'
  if (/i hear you|that's tough|understand|must be|sorry|rough/.test(t))     return 'empathetic'
  if (/hero|power|strength|unstoppable|legendary|superhero/.test(t))        return 'heroic'
  if (/think|hmm|let me|consider|wonder/.test(t))                           return 'thinking'
  if (/yes|amazing|awesome|incredible|fantastic|wow|great/.test(t))         return 'excited'
  return 'encouraging'
}

// ─── Gesture Arm Animations ───────────────────────────────────────────────────
const GESTURES = {
  encouraging: { r:{ rotate:[0,-100,-90,-100,0] }, l:{ rotate:[0,10,5,10,0] }, dur:0.9, rep:2 },
  joking:      { r:{ rotate:[0,-20,-10,-20,0],   x:[0,8,4,8,0] }, l:{ rotate:[0,20,10,20,0], x:[0,-8,-4,-8,0] }, dur:0.5, rep:Infinity },
  sarcastic:   { r:{ rotate:[0,40,30,40,0] }, l:{ rotate:[0,-40,-30,-40,0] }, dur:1.2, rep:2 },
  empathetic:  { r:{ rotate:[0,-30,-20,-30,0] }, l:{ rotate:[0,30,20,30,0] }, dur:1.8, rep:Infinity },
  heroic:      { r:{ rotate:[0,-10,0,-10,0] }, l:{ rotate:[0,10,0,10,0] }, dur:2, rep:Infinity },
  thinking:    { r:{ rotate:[0,-90,-85,-90] }, l:{ rotate:[0,5,3,5] }, dur:1.5, rep:Infinity },
  excited:     { r:{ rotate:[0,-120,-100,-120,0] }, l:{ rotate:[0,120,100,120,0] }, dur:0.7, rep:3 },
  idle:        { r:{ rotate:[0,-5,0,-5,0] }, l:{ rotate:[0,5,0,5,0] }, dur:3, rep:Infinity },
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
const speak = (text, langCode, companion, onEnd) => {
  if (!window.speechSynthesis) { onEnd?.(); return }
  window.speechSynthesis.cancel()
  const cfg = COMPANIONS[companion]
  const utt = new SpeechSynthesisUtterance(text)
  utt.pitch = cfg.pitch; utt.rate = cfg.rate; utt.volume = 1
  const voices = window.speechSynthesis.getVoices()
  const lp = langCode.split('-')[0]
  const match = voices.find(v => v.lang.startsWith(lp) && cfg.voiceHints.some(h => v.name.toLowerCase().includes(h)))
    || voices.find(v => v.lang === langCode)
    || voices.find(v => v.lang.startsWith(lp))
    || voices[0]
  if (match) utt.voice = match
  utt.onend = onEnd; utt.onerror = onEnd
  window.speechSynthesis.speak(utt)
}

// ─── Superhero Avatar ─────────────────────────────────────────────────────────
function SuperheroAvatar({ speaking, thinking, emotion, idle, companion }) {
  const [blink, setBlink] = useState(false)
  const cfg = COMPANIONS[companion]
  useEffect(() => {
    const t = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 120) }, 3500)
    return () => clearInterval(t)
  }, [])

  const isFemale = companion === 'luna'
  const gesture = thinking ? GESTURES.thinking : idle ? GESTURES.idle : GESTURES[EMOTIONS[emotion]?.gesture ?? 'idle']

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Power glow aura */}
      <motion.div
        animate={{ scale: speaking ? [1,1.15,1] : [1,1.05,1], opacity: speaking ? [0.4,0.7,0.4] : [0.2,0.35,0.2] }}
        transition={{ repeat:Infinity, duration: speaking ? 1 : 2.5 }}
        className={`absolute w-64 h-64 rounded-full blur-3xl top-0 pointer-events-none bg-gradient-to-br ${cfg.glow}`} />

      {/* Lightning sparks when speaking */}
      {speaking && [0,1,2,3].map(i => (
        <motion.div key={i} className="absolute text-lg pointer-events-none"
          style={{ top:`${20 + Math.random()*60}%`, left:`${10 + Math.random()*80}%` }}
          animate={{ opacity:[0,1,0], scale:[0.5,1.2,0] }}
          transition={{ repeat:Infinity, duration:0.6, delay:i*0.15 }}>
          {cfg.emblem}
        </motion.div>
      ))}

      {/* Emotion badge */}
      <AnimatePresence mode="wait">
        {emotion && !idle && (
          <motion.div key={emotion} initial={{ opacity:0, y:-12, scale:0.8 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, scale:0.8 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xl whitespace-nowrap z-30"
            style={{ background:`linear-gradient(to right, ${cfg.primary}, ${cfg.secondary})` }}>
            {EMOTIONS[emotion]?.emoji} {EMOTIONS[emotion]?.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BODY */}
      <motion.div animate={{ y: speaking ? [0,-5,0,-3,0] : idle ? [0,-2,0] : [0,-3,0] }}
        transition={{ repeat:Infinity, duration: speaking ? 0.7 : 2.5 }}
        className="relative flex flex-col items-center z-10">

        {/* CAPE (behind body) */}
        <motion.div
          animate={{ scaleX: ['heroic','excited'].includes(emotion) ? [1,1.4,1] : [1,1.05,1], skewY: speaking ? [0,2,0,-2,0] : [0,1,0] }}
          transition={{ repeat:Infinity, duration: speaking ? 0.8 : 3 }}
          className="absolute z-0 rounded-b-3xl"
          style={{
            width:'110px', height:'130px', top:'45px',
            background:`linear-gradient(170deg, ${cfg.capeColor} 0%, ${cfg.primary}99 60%, transparent 100%)`,
            borderRadius:'50% 50% 40% 40% / 20% 20% 50% 50%',
            filter:'blur(1px)'
          }} />

        {/* HAIR */}
        <div className="relative z-20">
          {isFemale ? (
            <>
              <div className="w-32 h-10 rounded-t-full" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #2d0050)` }} />
              <div className="absolute -left-3 top-3 w-5 h-24 rounded-l-3xl" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #2d0050)` }} />
              <div className="absolute -right-3 top-3 w-5 h-24 rounded-r-3xl" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #2d0050)` }} />
            </>
          ) : (
            <div className="w-32 h-11 rounded-t-full" style={{ background:`linear-gradient(to bottom, ${cfg.hairColor}, #220800)` }} />
          )}
        </div>

        {/* FACE */}
        <div className="relative z-20 -mt-3 flex flex-col items-center"
          style={{ background:'linear-gradient(160deg,#f5c5a0 0%,#e8a070 60%,#d4806a 100%)', borderRadius:'45% 45% 40% 40%/38% 38% 52% 52%', width:'7.5rem', height:'8.5rem', boxShadow:'0 6px 18px rgba(0,0,0,0.4)' }}>

          {/* Hero Mask */}
          <div className="absolute flex items-center gap-0" style={{ top:'22px', left:'50%', transform:'translateX(-50%)', zIndex:10 }}>
            <div className="rounded-tl-xl rounded-bl-sm" style={{ width:'30px', height:'22px', background:cfg.maskColor, opacity:0.9, clipPath:'polygon(0 0, 100% 0, 85% 100%, 0% 100%)' }} />
            <div className="w-3 h-4" style={{ background:cfg.maskColor, opacity:0.9 }} />
            <div className="rounded-tr-xl rounded-br-sm" style={{ width:'30px', height:'22px', background:cfg.maskColor, opacity:0.9, clipPath:'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }} />
          </div>

          {/* Eyes through mask */}
          <div className="flex gap-5 mt-5 relative z-20">
            {[0,1].map(i => (
              <div key={i} className="relative bg-white rounded-full flex items-center justify-center overflow-hidden shadow"
                style={{ width:'28px', height:'28px' }}>
                <div className="rounded-full flex items-center justify-center relative"
                  style={{ width:'17px', height:'17px', background:cfg.eyeColor }}>
                  <div className="rounded-full bg-black" style={{ width:'8px', height:'8px' }} />
                  <div className="absolute top-0.5 right-0.5 rounded-full bg-white opacity-80" style={{ width:'5px', height:'5px' }} />
                </div>
                {/* Glowing iris */}
                <motion.div animate={{ opacity:[0.3,0.7,0.3] }} transition={{ repeat:Infinity, duration:2 }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ boxShadow:`inset 0 0 6px ${cfg.eyeColor}` }} />
                <motion.div animate={{ scaleY:blink?1:0 }} transition={{ duration:0.08 }}
                  className="absolute inset-0 rounded-full origin-top" style={{ background:'#e8a070' }} />
              </div>
            ))}
          </div>

          {/* Nose */}
          <div className="mt-1.5 opacity-60 flex flex-col items-center">
            <div className="w-0.5 h-3 border-r-2 rounded-full" style={{ borderColor:'#c06040' }} />
            <div className="flex gap-2 -mt-0.5">
              {[0,1].map(i => <div key={i} className="w-2 h-1 border-b-2 rounded-full" style={{ borderColor:'#c06040' }} />)}
            </div>
          </div>

          {/* Mouth — hero smirk */}
          <div className="mt-1.5">
            {speaking ? (
              <motion.div animate={{ scaleY:[1,0.3,1,0.5,1], scaleX:[1,1.2,0.9,1.1,1] }}
                transition={{ repeat:Infinity, duration:0.4 }}
                className="overflow-hidden rounded-full"
                style={{ width:'38px', height:'15px', background:'#a02010' }}>
                <div className="absolute bottom-0 w-full h-1/2 opacity-50" style={{ background:'#e8a070' }} />
              </motion.div>
            ) : (
              // Smirk — offset to one side
              <div style={{ width:'36px', height:'8px', background:'#a02010', borderRadius:'0 0 12px 4px', marginLeft:'4px' }} />
            )}
          </div>

          {/* Ears */}
          <div className="absolute top-9" style={{ left:'-11px', width:'13px', height:'20px', background:'#f5c5a0', borderRadius:'50% 0 0 50%', borderLeft:'1px solid #e0a070' }} />
          <div className="absolute top-9" style={{ right:'-11px', width:'13px', height:'20px', background:'#f5c5a0', borderRadius:'0 50% 50% 0', borderRight:'1px solid #e0a070' }} />
        </div>

        {/* NECK */}
        <div className="-mt-0.5 w-9 h-5 z-10" style={{ background:'linear-gradient(to bottom, #e8a878, #d49060)' }} />

        {/* SUIT + ARMS */}
        <div className="relative flex items-start z-10">

          {/* LEFT ARM */}
          <motion.div style={{ originX:'100%', originY:'0%' }} animate={gesture.l}
            transition={{ duration:gesture.dur, repeat:gesture.rep, ease:'easeInOut' }}
            className="relative flex flex-col items-end mt-1">
            <div className="w-6 h-14 rounded-full" style={{ background:`linear-gradient(to bottom, ${cfg.primary}, ${cfg.secondary})` }} />
            <div className="w-6 h-6 rounded-full -mt-1" style={{ background:cfg.secondary }} />
            <div className="w-5 h-10 rounded-full -mt-1" style={{ background:'linear-gradient(to bottom, #f7c5a0, #e8a878)' }} />
            <div className="w-6 h-6 rounded-full -mt-1" style={{ background:'#f7c5a0', boxShadow:`0 0 8px ${cfg.accent}` }} />
          </motion.div>

          {/* TORSO — hero suit */}
          <div className="relative flex flex-col items-center mx-1 z-10">
            <div className="w-32 rounded-b-2xl flex flex-col items-center justify-start pt-1"
              style={{ height:'68px', background:`linear-gradient(135deg, ${cfg.primary} 0%, ${cfg.secondary} 50%, ${cfg.primary} 100%)` }}>
              {/* Suit neck */}
              <div className="w-10 h-6 rounded-b-full" style={{ background:'#1a1a1a' }} />
              {/* Hero emblem */}
              <motion.div animate={{ scale:[1,1.1,1], opacity:[0.8,1,0.8] }} transition={{ repeat:Infinity, duration:1.5 }}
                className="text-2xl mt-0.5 text-white font-black"
                style={{ textShadow:`0 0 10px ${cfg.accent}, 0 0 20px ${cfg.accent}` }}>
                {cfg.emblem}
              </motion.div>
              {/* Suit lines */}
              <div className="absolute inset-x-0 top-0 h-full opacity-20"
                style={{ background:'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px)' }} />
            </div>
          </div>

          {/* RIGHT ARM (gesture arm) */}
          <motion.div style={{ originX:'0%', originY:'0%' }} animate={gesture.r}
            transition={{ duration:gesture.dur, repeat:gesture.rep, ease:'easeInOut' }}
            className="relative flex flex-col items-start mt-1">
            <div className="w-6 h-14 rounded-full" style={{ background:`linear-gradient(to bottom, ${cfg.primary}, ${cfg.secondary})` }} />
            <div className="w-6 h-6 rounded-full -mt-1" style={{ background:cfg.secondary }} />
            <div className="w-5 h-10 rounded-full -mt-1" style={{ background:'linear-gradient(to bottom, #f7c5a0, #e8a878)' }} />
            {/* Fist / hand with power glow */}
            <motion.div animate={{ boxShadow: speaking ? [`0 0 8px ${cfg.accent}`, `0 0 16px ${cfg.accent}`, `0 0 8px ${cfg.accent}`] : `0 0 4px ${cfg.accent}` }}
              transition={{ repeat:Infinity, duration:0.8 }}
              className="w-6 h-6 rounded-full -mt-1" style={{ background:'#f7c5a0' }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Thinking bubbles */}
      {thinking && (
        <div className="absolute -top-2 -right-4 flex gap-1">
          {[0,1,2].map(i => (
            <motion.div key={i} className="rounded-full"
              style={{ width:`${6+i*2}px`, height:`${6+i*2}px`, background:cfg.accent }}
              animate={{ y:[0,-6,0], opacity:[0.4,1,0.4] }}
              transition={{ repeat:Infinity, duration:0.7, delay:i*0.15 }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mood prompts ──────────────────────────────────────────────────────────────
const MOOD_PROMPTS = [
  { label:"😔 Feeling down", text:"I'm feeling really down and unmotivated today." },
  { label:"😰 Exam stress", text:"I'm so stressed about my upcoming exams, I can't handle it." },
  { label:"😴 Exhausted", text:"I'm completely burned out and exhausted. I can't study anymore." },
  { label:"😤 Frustrated", text:"I'm frustrated. I've been studying but nothing is going in." },
  { label:"😂 Need a joke", text:"Tell me something funny to cheer me up!" },
  { label:"💪 Motivate me", text:"I need motivation! Give me your best pep talk!" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyCompanion() {
  const navigate = useNavigate()
  const [companion, setCompanion] = useState('blaze')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [muted, setMuted] = useState(false)
  const [listening, setListening] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [emotion, setEmotion] = useState('heroic')
  const [idle, setIdle] = useState(true)

  const chatRef  = useRef(null)
  const recRef   = useRef(null)
  const timerRef = useRef(null)
  const msgRef   = useRef(messages)

  useEffect(() => { msgRef.current = messages }, [messages])
  useEffect(() => { window.speechSynthesis?.getVoices() }, [])
  useEffect(() => {
    if (started) timerRef.current = setInterval(() => setCallTime(t => t+1), 1000)
    return () => clearInterval(timerRef.current)
  }, [started])
  useEffect(() => { chatRef.current?.scrollTo({ top:chatRef.current.scrollHeight, behavior:'smooth' }) }, [messages])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const cfg = COMPANIONS[companion]

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return
    setMessages(p => [...p, { role:'user', content:text }])
    setInput(''); setLoading(true); setIdle(false); setEmotion('thinking')
    try {
      const history = msgRef.current.map(m => ({ role:m.role, content:m.content }))
      const { data } = await axios.post(`${serverUrl}/api/companion/chat`, {
        message:text, companion, history, language:language.groq
      }, { withCredentials:true })
      const detected = detectEmotion(data.reply)
      setEmotion(detected)
      setMessages(p => [...p, { role:'assistant', content:data.reply, emotion:detected }])
      if (!muted) {
        setSpeaking(true)
        speak(data.reply, language.code, companion, () => { setSpeaking(false); setIdle(true) })
      } else { setIdle(true) }
    } catch {
      setMessages(p => [...p, { role:'assistant', content:"Ugh, my powers short-circuited! Try again? 😅", emotion:'sarcastic' }])
      setIdle(true)
    } finally { setLoading(false) }
  }, [loading, companion, language, muted])

  const startCall = () => {
    setStarted(true); setMessages([]); setCallTime(0); setEmotion('heroic')
    setTimeout(() => {
      const intro = cfg.intro
      setMessages([{ role:'assistant', content:intro, emotion:'heroic' }])
      if (!muted) { setSpeaking(true); speak(intro, language.code, companion, () => { setSpeaking(false); setIdle(true) }) }
    }, 400)
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
    setStarted(false); setMessages([]); setCallTime(0); setSpeaking(false)
  }

  // ── PRE-CALL SCREEN ────────────────────────────────────────────────────────
  if (!started) return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br ${cfg.bg} relative overflow-hidden`}>
      {/* Animated bg sparks */}
      {[...Array(8)].map((_,i) => (
        <motion.div key={i} className="absolute text-2xl pointer-events-none select-none"
          style={{ left:`${10+i*11}%`, top:`${15+Math.sin(i)*30}%` }}
          animate={{ y:[0,-20,0], opacity:[0.2,0.6,0.2], rotate:[0,15,0] }}
          transition={{ repeat:Infinity, duration:2+i*0.3, delay:i*0.4 }}>
          {cfg.emblem}
        </motion.div>
      ))}

      <motion.div initial={{ opacity:0, scale:0.93 }} animate={{ opacity:1, scale:1 }}
        className="relative w-full max-w-lg rounded-3xl border p-8 shadow-2xl backdrop-blur-xl bg-white/5"
        style={{ borderColor:`${cfg.primary}40` }}>

        {/* Avatar */}
        <div className="flex justify-center pt-6 mb-4">
          <SuperheroAvatar speaking={false} thinking={false} emotion="heroic" idle={false} companion={companion} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white">{cfg.title}</h1>
          <p className="text-sm mt-0.5" style={{ color:cfg.accent }}>{cfg.subtitle}</p>
          <p className="text-gray-400 text-xs mt-1">"{cfg.tagline}"</p>
        </div>

        {/* Companion selector */}
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">Choose your companion</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(COMPANIONS).map(([id, c]) => (
              <motion.button key={id} whileHover={{ scale:1.04 }} onClick={() => setCompanion(id)}
                className="py-4 rounded-2xl text-center transition border-2"
                style={{ borderColor: companion===id ? c.primary : 'rgba(255,255,255,0.1)', background: companion===id ? `${c.primary}25` : 'rgba(255,255,255,0.03)' }}>
                <div className="text-3xl mb-1">{id==='blaze' ? '⚡' : '🌙'}</div>
                <p className="font-bold text-white text-sm">{c.name}</p>
                <p className="text-xs opacity-50 mt-0.5">{c.subtitle}</p>
                {companion===id && <p className="text-xs mt-1 font-semibold" style={{ color:c.accent }}>✓ Selected</p>}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">Language</label>
          <div className="grid grid-cols-3 gap-1.5">
            {LANGUAGES.map(lang => (
              <motion.button key={lang.code} whileHover={{ scale:1.05 }} onClick={() => setLanguage(lang)}
                className="py-2 rounded-xl text-center text-xs transition border"
                style={{ borderColor: language.code===lang.code ? cfg.primary : 'rgba(255,255,255,0.1)', background: language.code===lang.code ? `${cfg.primary}25` : 'rgba(255,255,255,0.05)' }}>
                <div className="text-lg">{lang.flag}</div>
                <div className="text-xs mt-0.5 text-gray-300 truncate px-1">{lang.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button whileHover={{ scale:1.03 }} onClick={startCall}
          className="w-full py-4 rounded-2xl text-white font-black text-base shadow-xl"
          style={{ background:`linear-gradient(to right, ${cfg.primary}, ${cfg.secondary})` }}>
          📹 Call {cfg.name} Now! · {language.flag}
        </motion.button>
        <button onClick={() => navigate(-1)} className="mt-3 w-full text-center text-gray-500 text-xs hover:text-white transition">← Go back</button>
      </motion.div>
    </div>
  )

  // ── LIVE CALL SCREEN ───────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${cfg.bg}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50 backdrop-blur border-b flex-shrink-0" style={{ borderColor:`${cfg.primary}30` }}>
        <div className="flex items-center gap-3">
          <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ repeat:Infinity, duration:1.5 }}
            className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-white text-xs font-bold tracking-widest">LIVE</span>
          </motion.div>
          <span className="text-gray-400 text-xs font-mono">{fmt(callTime)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background:`${cfg.primary}40`, borderColor:`${cfg.primary}60` }}>
            {cfg.emblem} {cfg.name}
          </span>
        </div>
        <p className="text-white text-sm font-bold">My Companion</p>
        <span className={`text-xs px-3 py-1 rounded-full border ${
          loading  ? 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300' :
          speaking ? 'bg-green-500/20 border-green-400/40 text-green-300' :
                     'bg-white/10 border-white/20 text-gray-300'}`}>
          {loading ? '💭 Thinking' : speaking ? '🔊 Talking' : '👂 Ready'}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Companion panel */}
        <div className="flex flex-col items-center py-6 px-4 w-72 flex-shrink-0 border-r gap-5 overflow-y-auto"
          style={{ borderColor:`${cfg.primary}20`, background:'rgba(0,0,0,0.3)' }}>
          <div className="pt-10 pb-2">
            <SuperheroAvatar speaking={speaking} thinking={loading} emotion={emotion} idle={idle} companion={companion} />
          </div>
          <div className="text-center">
            <p className="text-white font-black text-lg">{cfg.title}</p>
            <p className="text-xs" style={{ color:cfg.accent }}>{cfg.subtitle}</p>
            <p className="text-gray-500 text-xs mt-1">{language.flag} {language.label}</p>
          </div>

          {/* Mood prompts */}
          <div className="w-full">
            <p className="text-gray-500 text-xs text-center uppercase tracking-wider mb-2">Quick Prompts</p>
            <div className="space-y-1.5">
              {MOOD_PROMPTS.map((mp, i) => (
                <motion.button key={i} whileHover={{ scale:1.02, x:4 }} onClick={() => sendMessage(mp.text)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-300 hover:text-white transition border border-white/10 bg-white/5 hover:bg-white/10">
                  {mp.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Student tile */}
          <div className="w-full rounded-2xl bg-white/5 border border-white/10 h-20 flex flex-col items-center justify-center relative">
            <div className="text-3xl">🧑‍💻</div>
            <p className="text-gray-400 text-xs">You</p>
            {listening && <span className="absolute top-2 right-2 text-xs text-red-400 animate-pulse">🎤</span>}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Right — Chat */}
        <div className="flex flex-col flex-1 bg-black/20">
          <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 border font-bold"
                    style={{ background: msg.role==='assistant' ? `linear-gradient(135deg, ${cfg.primary}, ${cfg.secondary})` : 'rgba(255,255,255,0.1)', borderColor: msg.role==='assistant' ? `${cfg.primary}60` : 'rgba(255,255,255,0.2)' }}>
                    {msg.role==='assistant' ? cfg.emblem : '🧑'}
                  </div>
                  <div className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role==='assistant' ? 'text-gray-100 rounded-tl-none border border-white/10' : 'text-white rounded-tr-none'
                  }`} style={{ background: msg.role==='assistant' ? 'rgba(255,255,255,0.07)' : `linear-gradient(135deg, ${cfg.primary}cc, ${cfg.secondary}cc)` }}>
                    {msg.content}
                    {msg.role==='assistant' && msg.emotion && (
                      <span className="ml-2 text-xs opacity-40">{EMOTIONS[msg.emotion]?.emoji}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:`linear-gradient(135deg, ${cfg.primary}, ${cfg.secondary})` }}>{cfg.emblem}</div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 bg-white/7 flex gap-1.5 items-center">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full"
                      style={{ background:cfg.accent }}
                      animate={{ y:[0,-5,0] }} transition={{ repeat:Infinity, duration:0.7, delay:i*0.15 }} />
                  ))}
                </div>
              </motion.div>
            )}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <div className="text-5xl">{cfg.emblem}</div>
                <p className="text-gray-400 text-sm">{cfg.name} is gearing up…</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-black/30" style={{ borderColor:`${cfg.primary}30` }}>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale:1.05 }} onClick={toggleListen}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-base border flex-shrink-0 transition ${listening ? 'bg-red-500 border-red-400 animate-pulse' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}>
                {listening ? '🔴' : '🎤'}
              </motion.button>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendMessage(input)}
                placeholder={`Talk to ${cfg.name}… they're listening ${cfg.emblem}`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none transition"
                style={{ '--tw-ring-color':cfg.primary }} />
              <motion.button whileHover={{ scale:1.05 }} disabled={!input.trim()||loading} onClick={() => sendMessage(input)}
                className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 text-base disabled:opacity-40"
                style={{ background:`linear-gradient(135deg, ${cfg.primary}, ${cfg.secondary})` }}>➤</motion.button>
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
