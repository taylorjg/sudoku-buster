const expect = require('chai').expect
const { solve } = require('../src/logic')
const { HARD_PUZZLE } = require('../src/logic/sample-puzzles')

describe('solve tests', () => {
  it('should find one solution to the hard puzzle', () => {
    const solutions = solve(HARD_PUZZLE)
    expect(solutions).to.have.length(1)
  })
})
