import PropTypes from "prop-types";
import React, { useRef, useState } from "react";
import { changeLanguage } from "redux-multilanguage";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
const LanguageCurrencyChanger = ({
  // currency,
  // setCurrency,
  strings,
  merchant,
  currentLanguageCode,
  dispatch
}) => {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  // Escape closes the list and returns focus to its button, as in the
  // account and cart dropdowns.
  const handleKeyDown = e => {
    if (e.key !== "Escape" || !open) return;
    setOpen(false);
    if (toggleRef.current) toggleRef.current.focus();
  };

  // The list closes when focus moves out of the switcher.
  const handleBlur = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  };

  const changeLanguageTrigger = e => {
    const languageCode = e.target.value;
    window.location.reload(false)
    dispatch(changeLanguage(languageCode));
  };

  // const setCurrencyTrigger = e => {
  //   const currencyName = e.target.value;
  //   setCurrency(currencyName);
  // };

  return (
    <div className="language-currency-wrap">
      <div
        className={`same-language-currency language-style${open ? " open" : ""}`}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      >
        <button
          type="button"
          className="lang-toggle"
          ref={toggleRef}
          aria-haspopup="true"
          aria-expanded={open ? "true" : "false"}
          aria-controls="lang-car-dropdown"
          onClick={() => setOpen(!open)}
        >
          <span>
            <span className="visually-hidden">{strings["Language"]}: </span>
            {currentLanguageCode === "en"
              ? strings["en"]
              : currentLanguageCode === "fr"
                ? strings["fr"]

                : ""}{" "}
            <i className="fa fa-angle-down" aria-hidden="true" />
          </span>
        </button>
        <div className="lang-car-dropdown" id="lang-car-dropdown">
          <ul>
            {merchant &&
              merchant.supportedLanguages.map((value, i) => {
                return (
                  <li key={i}>
                    <button
                      value={value.code}
                      lang={value.code}
                      aria-current={value.code === currentLanguageCode ? "true" : undefined}
                      onClick={e => changeLanguageTrigger(e)}
                    >
                      {strings[value.code]}
                    </button>
                  </li>
                )
              })
            }

          </ul>
        </div>
      </div>

      <div className="same-language-currency">
        <p>{strings['Call Us']} : {merchant.phone}</p>
      </div>
    </div>
  );
};

LanguageCurrencyChanger.propTypes = {
  // setCurrency: PropTypes.func,
  // currency: PropTypes.object,
  currentLanguageCode: PropTypes.string,
  dispatch: PropTypes.func,
  strings: PropTypes.object
};

const mapStateToProps = state => {
  return {
    merchant: state.merchantData.merchant
  };
};

const mapDispatchToProps = dispatch => {
  return {
  };
};

// Unwrapped for tests.
export { LanguageCurrencyChanger };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(multilanguage(LanguageCurrencyChanger));
// export default LanguageCurrencyChanger;
