import * as R from 'ramda'

export const inset = (x, y, w, h, dx, dy) =>
  [x + dx, y + dy, w - 2 * dx, h - 2 * dy]

export const calculateGridSquares = boundingBox => {
  const [bbx, bby, bbw, bbh] = boundingBox
  const w = bbw / 9
  const h = bbh / 9
  const dx = 2
  const dy = 2
  const rows = R.range(0, 9)
  const cols = R.range(0, 9)
  return R.chain(row =>
    R.map(col => {
      const x = bbx + col * w
      const y = bby + row * h
      return inset(x, y, w, h, dx, dy)
    }, cols),
    rows)
}
