import PropTypes from "prop-types";
import React, { Fragment } from "react";
import Header from "../wrappers/header/Header";
import Footer from "../wrappers/footer/Footer";
import { multilanguage } from "redux-multilanguage";

// Moves focus to the page content without changing the URL (a hash change
// would re-render the router and scroll back to the top).
const skipToContent = (e) => {
  const main = document.getElementById("main-content");
  if (main) {
    e.preventDefault();
    main.focus();
    main.scrollIntoView();
  }
};

const Layout = ({
  children,
  headerContainerClass,
  headerTop,
  headerPaddingClass,
  headerPositionClass,
  strings
}) => {
  return (
    <Fragment>
      <a className="skip-link" href="#main-content" onClick={skipToContent}>
        {(strings && strings["Skip to content"]) || "Skip to content"}
      </a>
      <Header
        layout={headerContainerClass}
        top={headerTop}
        headerPaddingClass={headerPaddingClass}
        headerPositionClass={headerPositionClass}
      />
      <main id="main-content" tabIndex="-1">
        {children}
      </main>
      <Footer
        backgroundColorClass="bg-gray"
        spaceTopClass="pt-100"
        spaceBottomClass="pb-70"
      />
    </Fragment>
  );
};

Layout.propTypes = {
  children: PropTypes.any,
  headerContainerClass: PropTypes.string,
  headerPaddingClass: PropTypes.string,
  headerPositionClass: PropTypes.string,
  headerTop: PropTypes.string
};

export default multilanguage(Layout);
