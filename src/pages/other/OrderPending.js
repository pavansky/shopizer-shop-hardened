import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { connect } from "react-redux";
import { multilanguage } from "redux-multilanguage";
import { getLocalData } from "../../util/helper";

// Shown when checkout answers 202 {errorCode: 'payment_pending'}: the order
// has been recorded and the payment gateway is still confirming the charge.
const OrderPending = ({ location, strings, merchant }) => {
  const { pathname } = location;
  const t = (key, fallback) => strings[key] || fallback;

  return (
    <Fragment>
      <MetaTags>
        <title>{merchant && merchant.name} | {t("Order received", "Order received")}</title>
      </MetaTags>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        {t("Order received", "Order received")}
      </BreadcrumbsItem>
      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        <Breadcrumb />
        <div className="error-area pt-40 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-7 col-lg-8 text-center">
                <div className="error">
                  <h3>{t("Order received", "Order received")}</h3>
                  <h2>{t("Your payment is being confirmed", "Your payment is being confirmed")}</h2>
                  <p>
                    {t("payment_pending_detail", "We have your order and are waiting for the payment provider to confirm the charge. Please do not pay again.")}
                    <br />
                    {t("payment_pending_email", "We will send the confirmation to")} {getLocalData('order-email')}
                  </p>
                  <Link to={"/"} className="error-btn">
                    {strings["Shop Now"]}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </Fragment>
  );
};

OrderPending.propTypes = {
  location: PropTypes.object
};

const mapStateToProps = state => {
  return {
    merchant: state.merchantData.merchant
  };
};
export default connect(mapStateToProps, null)(multilanguage(OrderPending));
