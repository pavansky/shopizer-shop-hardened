import WebService from './webService';
import { confirmCardPayment, isPaymentActionRequired, startCardPayment } from './stripePayment';

jest.mock('./webService', () => ({ __esModule: true, default: { post: jest.fn() } }));

describe('startCardPayment', () => {
  it('asks the backend for a stripe3 intent and returns its client secret', async () => {
    WebService.post.mockResolvedValue({ details: JSON.stringify({ TRANSACTIONID: 'pi_1', INTENTSECRET: 'pi_1_secret' }) });

    await expect(startCardPayment('cart/abc/payment/init?quote=3', 40.5)).resolves.toBe('pi_1_secret');
    expect(WebService.post).toHaveBeenCalledWith('cart/abc/payment/init?quote=3', {
      paymentModule: 'stripe3', paymentType: 'CREDITCARD', transactionType: 'INIT', amount: '40.5',
    });
  });

  it('fails when no client secret comes back', async () => {
    WebService.post.mockResolvedValue({ details: null });
    await expect(startCardPayment('cart/abc/payment/init', 1)).rejects.toThrow('could not be started');
  });
});

describe('confirmCardPayment', () => {
  const elements = {};

  it('confirms without leaving the page unless the method needs a redirect', async () => {
    const stripe = { confirmPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_1', status: 'requires_capture' } }) };

    await expect(confirmCardPayment(stripe, elements)).resolves.toBe('pi_1');
    expect(stripe.confirmPayment.mock.calls[0][0].redirect).toBe('if_required');
    expect(stripe.confirmPayment.mock.calls[0][0].elements).toBe(elements);
  });

  it('reports a refused card or a failed challenge', async () => {
    const stripe = { confirmPayment: jest.fn().mockResolvedValue({ error: { message: 'Authentication failed' } }) };
    await expect(confirmCardPayment(stripe, elements)).rejects.toThrow('Authentication failed');
  });

  it('does not check out an intent that is still waiting for the customer', async () => {
    const stripe = { confirmPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_1', status: 'requires_action' } }) };
    await expect(confirmCardPayment(stripe, elements)).rejects.toThrow('not completed');
  });
});

describe('isPaymentActionRequired', () => {
  it('matches only the 409 payment_action_required answer', () => {
    expect(isPaymentActionRequired({ response: { status: 409, data: { errorCode: 'payment_action_required' } } })).toBe(true);
    expect(isPaymentActionRequired({ response: { status: 409, data: { errorCode: '409' } } })).toBe(false);
    expect(isPaymentActionRequired({ response: { status: 503, data: {} } })).toBe(false);
    expect(isPaymentActionRequired(undefined)).toBe(false);
  });
});
