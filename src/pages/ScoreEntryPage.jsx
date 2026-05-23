import { useEffect, useState } from 'react'
import { getScores, getTeams, saveScores } from '../utils/storage'

export default function ScoreEntryPage() {
  const [teams, setTeams] = useState([])
  const [scores, setScores] = useState({})

  useEffect(() => {
    setTeams(getTeams())
    setScores(getScores())
  }, [])

  function updateScore(teamId, value) {
    const nextScores = {
      ...scores,
      [teamId]: value === '' ? 0 : Number(value)
    }

    setScores(nextScores)
    saveScores(nextScores)
  }

  function resetAllScores() {
    const confirmed = window.confirm('Reset all team scores to 0?')
    if (!confirmed) return

    const resetScores = {}
    teams.forEach((team) => {
      resetScores[team.id] = 0
    })

    setScores(resetScores)
    saveScores(resetScores)
  }

  return (
    <>
      <section className="card">
        <h2>Score Entry</h2>
        <p className="muted">
          Enter or update the score for each team.
        </p>

        {teams.length > 0 && (
          <button type="button" className="danger" onClick={resetAllScores}>
            Reset All Scores
          </button>
        )}
      </section>

      <section className="card">
        {teams.length === 0 ? (
          <p className="empty">Add teams first on the Teams page.</p>
        ) : (
          <ul className="list">
            {teams.map((team) => (
              <li key={team.id} className="row">
                <div className="row-left">
                  <strong>{team.name}</strong>
                  <span className="muted">Current score: {scores[team.id] ?? 0}</span>
                </div>

                <input
                  className="score-input"
                  type="number"
                  value={scores[team.id] ?? 0}
                  onChange={(e) => updateScore(team.id, e.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
