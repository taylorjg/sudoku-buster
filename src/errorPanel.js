export const showErrorPanel = errorMessage => {
  const parentElement = document.querySelector('body')
  const template = document.getElementById('error-panel-template')
  const clone = document.importNode(template.content, true)
  const errorPanelText = clone.querySelector('.error-panel-text')
  const closeBtn = clone.querySelector('.close')
  errorPanelText.textContent = errorMessage
  closeBtn.addEventListener('click', hideErrorPanel)
  parentElement.appendChild(clone)
}

export const hideErrorPanel = () => {
  const errorPanel = document.getElementById('error-panel')
  if (errorPanel) {
    errorPanel.parentNode.removeChild(errorPanel)
  }
}
