import WebService from './webService';
import {
  actionRequiredDetails, completeCardAction, confirmCardPayment, isPaymentActionRequired, startCardPayment,
} from './stripePayment';

jest.mock('./webService', () => ({ __esModule: true, default: { post: jest.fn() } }));

describe('startCardPayment', () => {
  it('asks the backend for a stripe3 intent and returns its client secret', async () => {
    WebService.post.mockResolvedValue({ details: JSON.stringify({ TRANSACTIONID: 'pi_1', INTENTSECRET: 'pi_1_secret' }) });

    await expect(startCardPayment('cart/abc/payment/init?quote=3', 40.5)).resolves.toBe('pi_1_secret');
    expect(WebService.post).toHaveBeenCalledWith('cart/abc/payment/init?quote=3', {
      paymentModule: 'stripe3', paymentType: 'CREDITCARD', transactionType: 'INIT', amount: '40.5',
    });
  });

  it('sends a guest address so the backend taxes the same address as checkout', async () => {
    WebService.post.mockResolvedValue({ details: JSON.stringify({ INTENTSECRET: 's' }) });
    const customer = { billing: { country: 'CA', zone: 'ON' } };

    await startCardPayment('cart/abc/payment/init', 45.77, customer);
    expect(WebService.post.mock.calls[WebService.post.mock.calls.length - 1][1].customer).toEqual(customer);
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

describe('completeCardAction', () => {
  it('finishes the challenge with the client secret from the 409 answer', async () => {
    const stripe = {
      confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_1', status: 'requires_capture' } }),
      confirmPayment: jest.fn(),
    };
    const answer = { response: { status: 409, data: { errorCode: 'payment_action_required', clientSecret: 'pi_1_secret_x', paymentIntentStatus: 'requires_action' } } };
    const { clientSecret, status } = actionRequiredDetails(answer);

    await expect(completeCardAction(stripe, clientSecret, status)).resolves.toBe('pi_1');
    expect(stripe.confirmCardPayment).toHaveBeenCalledWith('pi_1_secret_x');
    expect(stripe.confirmPayment).not.toHaveBeenCalled();
  });

  it('asks for another card when the card was refused, without calling Stripe', async () => {
    const stripe = { confirmCardPayment: jest.fn() };
    await expect(completeCardAction(stripe, 's', 'requires_payment_method')).rejects.toThrow('another card');
    expect(stripe.confirmCardPayment).not.toHaveBeenCalled();
  });

  it('reports a failed challenge', async () => {
    const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ error: { message: 'Authentication failed' } }) };
    await expect(completeCardAction(stripe, 's', 'requires_action')).rejects.toThrow('Authentication failed');
  });

  it('does not resubmit while the intent still waits for the customer', async () => {
    const stripe = { confirmCardPayment: jest.fn().mockResolvedValue({ paymentIntent: { id: 'pi_1', status: 'requires_action' } }) };
    await expect(completeCardAction(stripe, 's', 'requires_action')).rejects.toThrow('not completed');
  });
});
