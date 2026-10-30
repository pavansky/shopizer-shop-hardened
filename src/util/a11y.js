// Accessible names for form fields.
//
// The page templates write a visible <label> next to each field
// (<label>First Name</label><input ...>) without linking the two, so screen
// readers announce the field with no name (WCAG 1.3.1, 3.3.2, 4.1.2).
// associateLabels() links every such label to its field with for/id, and
// gives fields that have only a placeholder an aria-label. It runs once on
// start and again whenever React adds nodes, so it also covers forms such as
// checkout whose markup is not changed here.

const FIELD = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea';
let counter = 0;

function isField(el) {
  return !!el && el.nodeType === 1 && el.matches(FIELD);
}

function singleField(el) {
  if (!el || el.nodeType !== 1) return null;
  if (isField(el)) return el;
  const fields = el.querySelectorAll(FIELD);
  return fields.length === 1 ? fields[0] : null;
}

function hasName(field) {
  if (field.getAttribute('aria-label') || field.getAttribute('aria-labelledby')) return true;
  if (field.id && field.ownerDocument.querySelector('label[for="' + field.id + '"]')) return true;
  return !!field.closest('label');
}

function ensureId(field) {
  if (!field.id) {
    counter += 1;
    field.id = 'field-' + (field.name ? field.name.replace(/[^\w-]/g, '') + '-' : '') + counter;
  }
  return field.id;
}

export function associateLabels(root) {
  const scope = root || document;
  scope.querySelectorAll('label:not([for])').forEach((label) => {
    if (label.querySelector(FIELD) || !label.textContent.trim()) return;
    let field = singleField(label.nextElementSibling);
    if (!field) {
      // A checkbox or radio written before its label.
      const prev = label.previousElementSibling;
      if (isField(prev) && (prev.type === 'checkbox' || prev.type === 'radio')) field = prev;
    }
    if (field && !hasName(field)) {
      label.setAttribute('for', ensureId(field));
    }
  });
  scope.querySelectorAll(FIELD).forEach((field) => {
    if (hasName(field)) return;
    const placeholder = field.getAttribute('placeholder');
    if (placeholder && placeholder.trim()) {
      field.setAttribute('aria-label', placeholder.trim());
    }
  });
}

// Keeps labels linked while the single-page app renders new views.
export function watchLabels(doc) {
  const d = doc || document;
  let scheduled = false;
  const run = () => {
    scheduled = false;
    associateLabels(d);
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    (window.requestAnimationFrame || setTimeout)(run);
  };
  run();
  if (typeof MutationObserver === 'undefined') return () => {};
  const observer = new MutationObserver(schedule);
  observer.observe(d.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}
