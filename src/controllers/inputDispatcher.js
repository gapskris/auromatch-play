// Universal Input Dispatcher for AuroMatch
// Unifies PointerEvents (Mouse, Touch, Stylus) with DPR coordinate normalization
// Desktop Keyboard Bindings: U (Undo), H (Hint), R (Restart), Escape (Menu)

export class AuroMatchUniversalInput {
  constructor(canvasOrContainer, onAction) {
    this.target = canvasOrContainer;
    this.onAction = onAction;
    this.isPointerDown = false;
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundPointerCancel = this.handlePointerCancel.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    this.attachListeners();
  }

  attachListeners() {
    if (!this.target) return;

    this.target.addEventListener('pointerdown', this.boundPointerDown, { passive: false });
    window.addEventListener('pointermove', this.boundPointerMove, { passive: false });
    window.addEventListener('pointerup', this.boundPointerUp, { passive: false });
    window.addEventListener('pointercancel', this.boundPointerCancel, { passive: false });

    // Desktop Keyboard shortcuts
    window.addEventListener('keydown', this.boundKeyDown);

    // Prevent double-tap zoom and touch scrolling inside target
    this.target.style.touchAction = 'none';
  }

  detachListeners() {
    if (!this.target) return;

    this.target.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('pointercancel', this.boundPointerCancel);
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  normalizeCoordinates(event) {
    const rect = this.target.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    // Normalization across possible DPR scaling
    const scaleX = (this.target.width || rect.width) / rect.width;
    const scaleY = (this.target.height || rect.height) / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      rawX: clientX - rect.left,
      rawY: clientY - rect.top
    };
  }

  handlePointerDown(event) {
    this.isPointerDown = true;
    const coords = this.normalizeCoordinates(event);
    this.onAction({
      type: 'POINTER_DOWN',
      x: coords.x,
      y: coords.y,
      rawX: coords.rawX,
      rawY: coords.rawY,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      target: event.target
    });
  }

  handlePointerMove(event) {
    if (!this.isPointerDown) return;
    const coords = this.normalizeCoordinates(event);
    this.onAction({
      type: 'POINTER_MOVE',
      x: coords.x,
      y: coords.y,
      rawX: coords.rawX,
      rawY: coords.rawY,
      pointerId: event.pointerId
    });
  }

  handlePointerUp(event) {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    const coords = this.normalizeCoordinates(event);
    this.onAction({
      type: 'POINTER_UP',
      x: coords.x,
      y: coords.y,
      rawX: coords.rawX,
      rawY: coords.rawY,
      pointerId: event.pointerId
    });
  }

  handlePointerCancel(event) {
    this.isPointerDown = false;
    this.onAction({
      type: 'POINTER_CANCEL',
      pointerId: event.pointerId
    });
  }

  handleKeyDown(event) {
    // Avoid capturing inputs if user is typing in a textarea or input field
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'textarea' || activeTag === 'input') return;

    const key = event.key;
    if (key === 'u' || key === 'U') {
      event.preventDefault();
      this.onAction({ type: 'FREE_UNDO' });
    } else if (key === 'h' || key === 'H') {
      event.preventDefault();
      this.onAction({ type: 'REQUEST_HINT' });
    } else if (key === 'r' || key === 'R') {
      event.preventDefault();
      this.onAction({ type: 'RESTART_STAGE' });
    } else if (key === 's' || key === 'S') {
      event.preventDefault();
      this.onAction({ type: 'SHUFFLE_BOARD' });
    } else if (key === 'l' || key === 'L') {
      event.preventDefault();
      this.onAction({ type: 'TOGGLE_LORE' });
    } else if (key === 'Escape') {
      event.preventDefault();
      this.onAction({ type: 'TOGGLE_MENU' });
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(key)) {
      event.preventDefault();
      this.onAction({ type: 'NAV_KEY', key: key });
    }
  }
}
