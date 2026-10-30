import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Elements, ElementsConsumer, PaymentElement } from '@stripe/react-stripe-js';
import { completeCardAction, confirmCardPayment, startCardPayment } from '../../util/stripePayment';

// Stripe Payment Element for one cart total. A new PaymentIntent is started
// whenever the total or the tax address changes, so the intent amount always
// matches the order. customer holds a guest's billing and delivery addresses
// (null for a signed-in customer); waitForAddress holds the form until the
// guest has chosen a country.
// children receives confirm(): it confirms the intent (running 3-D Secure when
// the issuer asks) and resolves with the PaymentIntent id to check out with;
// and completeAction(clientSecret, status), which finishes the intent after a
// checkout answered 409 payment_action_required.
const StripePaymentForm = ({ stripePromise, initAction, amount, customer, waitForAddress, locale, children }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);
  const address = customer ? JSON.stringify(customer) : null;

  useEffect(() => {
    if (amount == null || waitForAddress) {
      return undefined;
    }
    let current = true;
    setClientSecret(null);
    setError(null);
    startCardPayment(initAction, amount, address ? JSON.parse(address) : null)
      .then((secret) => { if (current) setClientSecret(secret); })
      .catch((e) => {
        if (!current) return;
        const message = e && e.response && e.response.data && e.response.data.message;
        setError(message || e.message || 'The payment could not be started');
      });
    return () => { current = false; };
  }, [initAction, amount, address, waitForAddress]);

  if (waitForAddress) {
    return <p>Enter your address to pay by card.</p>;
  }
  if (error) {
    return <p className="error-msg">{error}</p>;
  }
  if (!clientSecret) {
    return <p>Loading the payment form...</p>;
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale }} key={clientSecret}>
      <ElementsConsumer>
        {({ stripe, elements }) => (
          <>
            <div className="card-info">
              <PaymentElement />
            </div>
            {children(() => confirmCardPayment(stripe, elements),
              (secret, status) => completeCardAction(stripe, secret, status))}
          </>
        )}
      </ElementsConsumer>
    </Elements>
  );
};

StripePaymentForm.propTypes = {
  stripePromise: PropTypes.object,
  initAction: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  customer: PropTypes.object,
  waitForAddress: PropTypes.bool,
  locale: PropTypes.string,
  children: PropTypes.func.isRequired,
};

export default StripePaymentForm;
