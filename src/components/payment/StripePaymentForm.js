import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { Elements, ElementsConsumer, PaymentElement } from '@stripe/react-stripe-js';
import { confirmCardPayment, startCardPayment } from '../../util/stripePayment';

// Stripe Payment Element for one cart total. A new PaymentIntent is started
// whenever the total changes, so the intent amount always matches the order.
// children receives confirm(): it confirms the intent (running 3-D Secure when
// the issuer asks) and resolves with the PaymentIntent id to check out with.
const StripePaymentForm = ({ stripePromise, initAction, amount, locale, children }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (amount == null) {
      return undefined;
    }
    let current = true;
    setClientSecret(null);
    setError(null);
    startCardPayment(initAction, amount)
      .then((secret) => { if (current) setClientSecret(secret); })
      .catch((e) => {
        if (!current) return;
        const message = e && e.response && e.response.data && e.response.data.message;
        setError(message || e.message || 'The payment could not be started');
      });
    return () => { current = false; };
  }, [initAction, amount]);

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
            {children(() => confirmCardPayment(stripe, elements))}
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
  locale: PropTypes.string,
  children: PropTypes.func.isRequired,
};

export default StripePaymentForm;
