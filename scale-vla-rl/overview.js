(() => {
  const trigger = document.querySelector('.overview-expand');
  const dialog = document.querySelector('#overview-dialog');
  // The image link remains usable in browsers without dialog support.
  if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;

  trigger.addEventListener('click', (event) => {
    // Preserve opening the original image in another tab with a modifier key.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    dialog.showModal();
    document.body.classList.add('overview-open');
  });

  dialog.querySelector('.overview-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left ||
        event.clientX > bounds.right || event.clientY < bounds.top ||
        event.clientY > bounds.bottom)) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('overview-open');
    trigger.focus({ preventScroll: true });
  });
})();
