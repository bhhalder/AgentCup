import { useEffect, useState } from 'react'
import { getScores, getTeams, saveScores, saveTeams } from '../utils/storage'

export default function TeamSetupPage() {
  const [teams, setTeams] = useState([])
  const [teamName, setTeamName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    setTeams(getTeams())
  }, [])

  function persistTeams(nextTeams) {
    setTeams(nextTeams)
    saveTeams(nextTeams)
  }

  function addTeam(e) {
    e.preventDefault()

    const trimmed = teamName.trim()
    if (!trimmed) return

    const alreadyExists = teams.some(
      (team) => team.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) {
      alert('Team name already exists.')
      return
    }

    const newTeam = {
      id: crypto.randomUUID(),
      name: trimmed
    }

    persistTeams([...teams, newTeam])
    setTeamName('')
  }

  function startEdit(team) {
    setEditingId(team.id)
    setEditingName(team.name)
  }

  function saveEdit(id) {
    const trimmed = editingName.trim()
    if (!trimmed) return

    const alreadyExists = teams.some(
      (team) =>
        team.id !== id && team.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) {
      alert('Another team already uses that name.')
      return
    }

    const nextTeams = teams.map((team) =>
      team.id === id ? { ...team, name: trimmed } : team
    )

    persistTeams(nextTeams)
    setEditingId(null)
    setEditingName('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  function deleteTeam(id) {
    const confirmed = window.confirm('Delete this team and its score?')
    if (!confirmed) return

    const nextTeams = teams.filter((team) => team.id !== id)
    const nextScores = { ...getScores() }
    delete nextScores[id]

    persistTeams(nextTeams)
    saveScores(nextScores)
  }

  return (
    <>
      <section className="card">
        <h2>Team Setup</h2>
        <p className="muted">
          Add, rename, or remove teams. Scores are stored locally in your browser.
        </p>

        <form onSubmit={addTeam} className="form-row">
          <input
            type="text"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
          <button type="submit">Add Team</button>
        </form>
      </section>

      <section className="card">
        <h3>Teams</h3>

        {teams.length === 0 ? (
          <p className="empty">No teams added yet.</p>
        ) : (
          <ul className="list">
            {teams.map((team) => (
              <li key={team.id} className="row">
                {editingId === team.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                    />
                    <div className="form-row">
                      <button type="button" onClick={() => saveEdit(team.id)}>
                        Save
                      </button>
                      <button type="button" className="danger" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row-left">
                      <strong>{team.name}</strong>
                      <span className="muted">ID: {team.id}</span>
                    </div>

                    <div className="form-row">
                      <button type="button" onClick={() => startEdit(team)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteTeam(team.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
