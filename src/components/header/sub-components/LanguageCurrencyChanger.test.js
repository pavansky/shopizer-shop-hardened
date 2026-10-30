import React from 'react';
import ReactDOM from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';
import { LanguageCurrencyChanger } from './LanguageCurrencyChanger';

const props = {
  strings: { Language: 'Language', en: 'English', fr: 'French', 'Call Us': 'Call us' },
  merchant: { phone: '555', supportedLanguages: [{ code: 'en' }, { code: 'fr' }] },
  currentLanguageCode: 'en',
  dispatch: () => {},
};

describe('LanguageCurrencyChanger', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      ReactDOM.render(<LanguageCurrencyChanger {...props} />, container);
    });
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  const toggle = () => container.querySelector('.lang-toggle');
  const wrap = () => container.querySelector('.language-style');

  it('opens from its button and reports the state', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    act(() => Simulate.click(toggle()));
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(wrap().classList.contains('open')).toBe(true);
    expect(container.querySelector('button[lang="en"]').getAttribute('aria-current')).toBe('true');
  });

  it('closes on Escape and returns focus to the button', () => {
    act(() => Simulate.click(toggle()));
    container.querySelector('button[lang="fr"]').focus();
    act(() => Simulate.keyDown(wrap(), { key: 'Escape' }));
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(wrap().classList.contains('open')).toBe(false);
    expect(document.activeElement).toBe(toggle());
  });

  it('closes when focus leaves the switcher, not when it moves inside', () => {
    act(() => Simulate.click(toggle()));
    act(() => Simulate.blur(wrap(), { relatedTarget: container.querySelector('button[lang="fr"]') }));
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    act(() => Simulate.blur(wrap(), { relatedTarget: document.body }));
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });
});
