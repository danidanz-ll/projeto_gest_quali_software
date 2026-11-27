export class TaskCelebration {
  constructor({ dialog, title, continueButton, fallbackFocus = null, onClose = () => {} }) {
    this.dialog = dialog;
    this.title = title;
    this.continueButton = continueButton;
    this.fallbackFocus = fallbackFocus;
    this.onClose = onClose;
    this.previousFocus = null;

    this.continueButton.addEventListener('click', () => this.close());
    this.dialog.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  show(taskName) {
    if (!this.dialog.hidden) return false;

    this.previousFocus = document.activeElement;
    this.title.textContent = taskName;
    this.dialog.hidden = false;
    this.continueButton.focus();
    return true;
  }

  close() {
    if (this.dialog.hidden) return false;

    this.dialog.hidden = true;
    const focusTarget = this.previousFocus
      && this.previousFocus.isConnected !== false
      && !this.previousFocus.hidden
      && !this.previousFocus.disabled
      ? this.previousFocus
      : this.fallbackFocus;
    focusTarget?.focus();
    this.previousFocus = null;
    this.onClose();
    return true;
  }

  handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    const controls = [...this.dialog.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )].filter((control) => !control.hidden);

    if (controls.length === 0) {
      event.preventDefault();
      this.dialog.focus();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    if (controls.length === 1 || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();
      first.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
