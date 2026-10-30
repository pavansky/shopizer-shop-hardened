import PropTypes from "prop-types";
import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import { multilanguage } from "redux-multilanguage";
import { connect } from "react-redux";
import { useSeo } from "../../util/seo";
const NotFound = ({ location, strings, merchant }) => {
  // const { pathname } = location;
  // A client-rendered app cannot send a 404 status; noindex keeps the page
  // out of search results instead.
  useSeo({ robots: "noindex" });

  return (
    <Fragment>
      <MetaTags>
        <title>{strings["Page Not Found"]}{merchant && merchant.name ? " | " + merchant.name : ""}</title>
        {/* <meta
          name="description"
          content="404 page of flone react minimalist eCommerce template."
        /> */}
      </MetaTags>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={"/login"}>

        {strings["Page Not Found"]}
      </BreadcrumbsItem>
      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />
        <div className="error-area pt-40 pb-100">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-7 col-lg-8 text-center">
                <div className="error">
                  <h1>404</h1>
                  <h2>OPPS! {strings["Page Not Found"]}</h2>
                  <p>
                    {strings["404 Page Note"]}
                  </p>
                  {/* <form className="searchform mb-50"> */}
                  {/* <input
                      type="text"
                      name="search"
                      id="error_search"
                      placeholder="Search..."
                      className="searchform__input"
                    /> */}
                  {/* <button type="submit" className="searchform__submit">
                      <i className="fa fa-search" />
                    </button> */}
                  {/* </form> */}
                  <Link to={process.env.PUBLIC_URL + "/"} className="error-btn">
                    Back to home page
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

NotFound.propTypes = {
  location: PropTypes.object
};

const mapStateToProps = state => ({
  merchant: state.merchantData.merchant
});

export default connect(mapStateToProps)(multilanguage(NotFound));
