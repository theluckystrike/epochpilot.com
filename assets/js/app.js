/* EpochPilot — Tool Component Loader */
const container = document.getElementById('tool-container');
if (container) {
  const component = container.dataset.component;
  const config = JSON.parse(container.dataset.config || '{}');
  if (component) {
    import(`./components/${component}.js`).then(m => m.init(container, config)).catch(err => {
      container.innerHTML = '<p style="color:#ef4444;">Failed to load tool component. Please refresh the page.</p>';
      console.error('Component load error:', err);
    });
  }
}
