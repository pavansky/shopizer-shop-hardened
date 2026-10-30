import PropTypes from "prop-types";
import React from "react";
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
      <div className="same-language-currency language-style">
        <button type="button" className="lang-toggle" aria-haspopup="true">
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
        <div className="lang-car-dropdown">
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(multilanguage(LanguageCurrencyChanger));
// export default LanguageCurrencyChanger;
