import WebService from './webService';

// Checkout error code: the PaymentIntent is not paid yet (3-D Secure pending or
// card refused at confirmation). Nothing was charged and the order is kept open.
export const PAYMENT_ACTION_REQUIRED = 'payment_action_required';

// PaymentIntent statuses after a successful confirmation. Intents are created
// with manual capture, so an authorised card is requires_capture; the backend
// captures it at checkout.
const CONFIRMED = ['requires_capture', 'succeeded', 'processing'];

// Starts a card payment: the backend creates the PaymentIntent for the
// server-side cart total and answers with its client secret. The amount sent
// is only compared with that total (409 when the cart changed).
export async function startCardPayment(action, amount) {
  const transaction = await WebService.post(action, {
    paymentModule: 'stripe3',
    paymentType: 'CREDITCARD',
    transactionType: 'INIT',
    amount: amount == null ? null : String(amount),
  });
  const details = transaction && transaction.details ? JSON.parse(transaction.details) : {};
  if (!details.INTENTSECRET) {
    throw new Error('The payment could not be started');
  }
  return details.INTENTSECRET;
}

// Confirms the PaymentIntent with the card entered in the Payment Element.
// When the issuer asks for 3-D Secure, Stripe.js shows the challenge here and
// resolves once the customer completed it. Resolves with the PaymentIntent id.
export async function confirmCardPayment(stripe, elements) {
  if (!stripe || !elements) {
    throw new Error('The payment form is not ready yet');
  }
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    redirect: 'if_required',
    confirmParams: { return_url: window.location.href },
  });
  if (error) {
    throw new Error(error.message || 'Your card could not be confirmed');
  }
  if (!paymentIntent || CONFIRMED.indexOf(paymentIntent.status) < 0) {
    throw new Error('The payment was not completed');
  }
  return paymentIntent.id;
}

// True for the checkout answer "complete the payment, then submit again".
export function isPaymentActionRequired(error) {
  const response = error && error.response;
  return !!response && response.status === 409 && !!response.data
    && response.data.errorCode === PAYMENT_ACTION_REQUIRED;
}
