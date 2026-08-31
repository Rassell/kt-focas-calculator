import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Fight from './pages/Fight'
import Shooting from './pages/Shooting'
import './App.css'

export default function App() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo">⚔️</span>
            <div>
              <h1>KT FOCAS Calculator</h1>
              <p>Kill Team 2026 Calculator — work out the odds</p>
            </div>
          </div>
          <nav className="nav">
            <NavLink to="/fight" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Fight</NavLink>
            <NavLink to="/shooting" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Shooting</NavLink>
            <span className="nav-sep" aria-hidden>·</span>
            <a href="https://ktcalc.com/help" target="_blank" rel="noreferrer">How it works</a>
            <a href="https://github.com/jfreal/ktcalc" target="_blank" rel="noreferrer">GitHub</a>
            <button className="help-btn" onClick={() => setShowHelp(v => !v)}>{showHelp ? 'Hide Help' : 'Help'}</button>
          </nav>
        </div>
      </header>

      {showHelp && (
        <div className="help">
          <h3>How it works</h3>
          <p>Set your ballistic skill / weapon skill, attacks, weapon rules, and cover, then read the chance of damage and kills. Starred items have hovertext. Geared ⚙️ items are advanced — tick Advanced to show them.</p>
          <ul>
            <li><strong>Balanced</strong> rerolls 1 die. <strong>Relentless</strong> rerolls fails. <strong>Ceaseless</strong> rerolls 1s.</li>
            <li><strong>Rending:</strong> if ≥1 crit, retain a normal as crit. <strong>Severe:</strong> if no crits, change a normal to crit.</li>
            <li><strong>Obscured:</strong> attacker crits are retained as normals.</li>
            <li><strong>Cover Saves:</strong> auto-retained saves. <strong>JaS:</strong> Just a Scratch — ignore one hit.</li>
            <li><strong>Devastating:</strong> MW per crit (unsavable). <strong>Piercing:</strong> worsens save by AP.</li>
          </ul>
        </div>
      )}

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/fight" replace />} />
          <Route path="/fight" element={<Fight />} />
          <Route path="/shooting" element={<Shooting />} />
          <Route path="*" element={<Navigate to="/fight" replace />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>KT FOCAS Calculator — Kill Team 2026 Edition • <a href="https://ktcalc.com" target="_blank" rel="noreferrer">Inspired by ktcalc.com</a> • <a href="https://github.com/jfreal/ktcalc" target="_blank" rel="noreferrer">Open source</a> • <a href="https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf" target="_blank" rel="noreferrer">Lite Rules PDF</a></span>
      </footer>
    </div>
  )
}
