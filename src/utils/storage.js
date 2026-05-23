const TEAMS_KEY = 'team-dashboard:teams'
const SCORES_KEY = 'team-dashboard:scores'

export function getTeams() {
  try {
    return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveTeams(teams) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
}

export function getScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveScores(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
}
