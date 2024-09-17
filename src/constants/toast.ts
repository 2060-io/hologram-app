export const SHOW_TOAST_MESSAGE = 'SHOW_TOAST_MESSAGE'

type Color = {
  [type: string]: {
    backgroundColor: string
    color: string
    borderColor: string
  }
}

export const COLORS: Color = {
  ['info']: { backgroundColor: '#cff4fc', color: '#055160', borderColor: '#b6effb' },
  ['warning']: { backgroundColor: '#fff3cd', color: '#664d03', borderColor: '#ffecb5' },
  ['error']: { backgroundColor: 'rgba(245, 3, 75, 0.25)', color: '#FFFFFF', borderColor: '#F5034B' },
  ['success']: { backgroundColor: '#d1e7dd', color: '#0f5132', borderColor: '#badbcc' },
}
