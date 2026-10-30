import { associateLabels } from './a11y';

describe('associateLabels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('links a label to the input that follows it', () => {
    document.body.innerHTML = '<div><label>First Name</label><input type="text" name="firstName"></div>';
    associateLabels(document);
    const input = document.querySelector('input');
    expect(input.id).toBeTruthy();
    expect(document.querySelector('label').getAttribute('for')).toBe(input.id);
  });

  it('links a label to a select inside the next wrapper', () => {
    document.body.innerHTML = '<label>Country</label><div class="billing-select"><select><option>CA</option></select></div>';
    associateLabels(document);
    expect(document.querySelector('label').getAttribute('for')).toBe(document.querySelector('select').id);
  });

  it('links a checkbox written before its label', () => {
    document.body.innerHTML = '<input type="checkbox"><label>Create an account</label>';
    associateLabels(document);
    expect(document.querySelector('label').getAttribute('for')).toBe(document.querySelector('input').id);
  });

  it('keeps existing ids and does not relabel a named field', () => {
    document.body.innerHTML = '<label for="x">X</label><input id="x"><label>Y</label><input id="y" aria-label="Why">';
    associateLabels(document);
    const labels = document.querySelectorAll('label');
    expect(labels[0].getAttribute('for')).toBe('x');
    expect(labels[1].hasAttribute('for')).toBe(false);
  });

  it('names a field that only has a placeholder', () => {
    document.body.innerHTML = '<input type="email" placeholder="Email address">';
    associateLabels(document);
    expect(document.querySelector('input').getAttribute('aria-label')).toBe('Email address');
  });
});
