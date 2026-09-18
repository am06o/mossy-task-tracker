import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'
import './AuthView.css'

export default function AuthView() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  if (!supabaseConfigured) {
    return (
      <div className="auth-view">
        <div className="auth-card">
          <h1 className="auth-title">mossy</h1>
          <p className="auth-setup-notice">
            아직 클라우드 연결이 설정되지 않았어요.
            <br />
            <code>.env</code>에 <code>VITE_SUPABASE_URL</code>과 <code>VITE_SUPABASE_ANON_KEY</code>를 넣고 다시
            빌드해주세요.
          </p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ type: 'ok', text: '가입됐어요. 바로 로그인해서 써보세요.' })
        setMode('signin')
      }
    } catch (err) {
      setMessage({ type: 'error', text: translateAuthError(err.message) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-view">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">mossy</h1>
        <p className="auth-subtitle">{mode === 'signin' ? '로그인' : '계정 만들기'}</p>

        <input
          type="email"
          className="auth-input"
          placeholder="이메일"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="auth-input"
          placeholder="비밀번호"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {message && <p className={`auth-message auth-message--${message.type}`}>{message.text}</p>}

        <button type="submit" className="auth-submit" disabled={busy}>
          {busy ? '처리 중…' : mode === 'signin' ? '로그인' : '가입하기'}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
            setMessage(null)
          }}
        >
          {mode === 'signin' ? '계정이 없으신가요? 가입하기' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </form>
    </div>
  )
}

function translateAuthError(message) {
  if (/invalid login credentials/i.test(message)) return '이메일 또는 비밀번호가 맞지 않아요.'
  if (/already registered/i.test(message)) return '이미 가입된 이메일이에요.'
  if (/password/i.test(message) && /6/i.test(message)) return '비밀번호는 6자 이상이어야 해요.'
  if (/failed to fetch|network/i.test(message)) return '인터넷 연결을 확인해주세요.'
  return message
}
