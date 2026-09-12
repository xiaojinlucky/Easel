document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('click', async () => {
    try { await window.easelDesktop.action(button.dataset.action); }
    catch (error) { document.getElementById('status').textContent = error.message; }
  });
});
window.easelDesktop.onState(state => {
  document.getElementById('status').textContent = state.status;
  document.getElementById('message').textContent = state.message || state.status;
  document.querySelectorAll('nav button').forEach(button => button.classList.toggle('selected', button.dataset.action === state.active));
});
window.easelDesktop.action('ready').catch(error => { document.getElementById('status').textContent = error.message; });
