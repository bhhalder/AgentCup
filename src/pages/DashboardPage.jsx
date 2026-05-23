import { useEffect, useMemo, useState } from 'react'
import { getScores, getTeams } from '../utils/storage'

export default function DashboardPage() {
  const [teams, setTeams] = useState([])
  const [scores, setScores] = useState({})

  useEffect(() => {
    setTeams(getTeams())
    setScores(getScores())

    function syncFromStorage() {
      setTeams(getTeams())
      setScores(getScores())
    }

    window.addEventListener('storage', syncFromStorage)
    window.addEventListener('focus', syncFromStorage)

    return () => {
      window.removeEventListener('storage', syncFromStorage)
      window.removeEventListener('focus', syncFromStorage)
    }
  }, [])

  const rankings = useMemo(() => {
    return teams
      .map((team) => ({
        ...team,
        score: Number(scores[team.id] ?? 0)
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.name.localeCompare(b.name)
      })
  }, [teams, scores])

  const topTeam = rankings[0]

  return (
    <>
      <section className="card">
        <h2>Rankings Dashboard</h2>
        {topTeam ? (
          <p className="muted">
            Current leader: <span className="top-team">{topTeam.name}</span> with{' '}
            <strong>{topTeam.score}</strong> points.
          </p>
        ) : (
          <p className="muted">No rankings yet. Add teams and scores to begin.</p>
        )}
      </section>

      <section className="card">
        {rankings.length === 0 ? (
          <p className="empty">No teams available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((team, index) => (
                <tr key={team.id}>
                  <td>
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td>{team.name}</td>
                  <td>{team.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
