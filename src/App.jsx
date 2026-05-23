import { NavLink, Route, Routes } from 'react-router-dom'
import TeamSetupPage from './pages/TeamSetupPage'
import ScoreEntryPage from './pages/ScoreEntryPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>Team Ranking Dashboard</h1>
          <p className="subtitle">
            Setup teams, enter scores, and view rankings in one place.
          </p>
        </div>
      </header>

      <nav className="nav">
        <NavLink to="/" end>
          Teams
        </NavLink>
        <NavLink to="/scores">
          Scores
        </NavLink>
        <NavLink to="/dashboard">
          Dashboard
        </NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<TeamSetupPage />} />
          <Route path="/scores" element={<ScoreEntryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  )
}
