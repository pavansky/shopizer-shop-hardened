import PropTypes from "prop-types";
import React, { Fragment, useEffect, useState } from "react";
import MetaTags from "react-meta-tags";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import Layout from "../../layouts/Layout";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
// import RelatedProductSlider from "../../wrappers/product/RelatedProductSlider";
import ProductDescriptionTab from "../../wrappers/product/ProductDescriptionTab";
import ProductImageDescription from "../../wrappers/product/ProductImageDescription";
import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "../../redux/actions/loaderActions";
import { multilanguage } from "redux-multilanguage";
const ProductDetails = ({ strings, location, match, currentLanguageCode, setLoader, defaultStore }) => {
  const { pathname } = location;
  // The route parameter is the product slug (friendlyUrl). It is the only
  // reliable key on a deep link or page reload, where no product id has been
  // stored by a previous click.
  const slug = match && match.params ? match.params.id : undefined;
  const [productDetails, setProductDetails] = useState();
  const [productReview, setProductReview] = useState([]);

  useEffect(() => {
    getProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const getProductDetails = async () => {
    setLoader(true)
    if (!slug) {
      setLoader(false)
      return
    }
    // GET /api/v1/product/{friendlyUrl}
    let action = constant.ACTION.PRODUCT + encodeURIComponent(slug) + '?lang=' + currentLanguageCode + '&store=' + defaultStore;
    try {
      let response = await WebService.get(action);
      if (response) {
        setProductDetails(response)
        getReview(response.id)
      }
    } catch (error) {
    }
    setLoader(false)
  }
  const getReview = async (id) => {
    if (!id) return;
    // GET /api/v1/product/{id}/reviews
    let action = constant.ACTION.PRODUCT + id + '/reviews?store=' + defaultStore;
    try {
      let response = await WebService.get(action);
      if (response) {
        setProductReview(response)
      }
    } catch (error) {
    }
  }
  return (
    <Fragment>
      <MetaTags>
        <title>{productDetails && productDetails.description.title}</title>
        <meta
          name="description"
          content={productDetails && productDetails.description.metaDescription}
        />
      </MetaTags>

      <BreadcrumbsItem to={process.env.PUBLIC_URL + "/"}>{strings["Home"]}</BreadcrumbsItem>
      <BreadcrumbsItem to={process.env.PUBLIC_URL + pathname}>
        {productDetails && productDetails.description.name}
      </BreadcrumbsItem>

      <Layout headerContainerClass="container-fluid"
        headerPaddingClass="header-padding-2"
        headerTop="visible">
        {/* breadcrumb */}
        <Breadcrumb />

        {/* product description with image */}
        {
          productDetails &&
          <ProductImageDescription
            spaceTopClass="pt-100"
            spaceBottomClass="pb-100"
            strings={strings}
            product={productDetails}
          />
        }


        {/* product description tab */}
        {
          productDetails &&
          <ProductDescriptionTab
            spaceBottomClass="pb-90"
            strings={strings}
            product={productDetails}
            review={productReview}
          />
        }

        {/* related product slider */}
        {/* <RelatedProductSlider
          spaceBottomClass="pb-95"
          category={product.category[0]}
        /> */}
      </Layout>
    </Fragment>
  );
};

ProductDetails.propTypes = {
  location: PropTypes.object,
  match: PropTypes.object,
  currentLanguageCode: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => {
  // const itemId = ownProps.match.params.id;
  return {
    currentLanguageCode: state.multilanguage.currentLanguageCode,
    defaultStore: state.merchantData.defaultStore
  };
};
const mapDispatchToProps = dispatch => {
  return {
    setLoader: (value) => {
      dispatch(setLoader(value));
    }
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(ProductDetails));
