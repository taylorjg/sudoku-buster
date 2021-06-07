import Stats from 'stats.js'

export class StatsWrapper {

  constructor(fpsOn, documentBody) {
    this.fpsOn = fpsOn
    this.documentBody = documentBody
    this.stats = null
  }

  show() {
    if (this.fpsOn) {
      this.stats = new Stats()
      this.documentBody.appendChild(this.stats.dom)
    }
  }

  hide() {
    if (this.stats) {
      this.documentBody.removeChild(this.stats.dom)
      this.stats = null
    }
  }

  begin() {
    if (this.stats) {
      this.stats.begin()
    }
  }

  end() {
    if (this.stats) {
      this.stats.end()
    }
  }
}
