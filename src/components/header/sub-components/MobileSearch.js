import React from "react";

const MobileSearch = () => {
  return (
    <div className="offcanvas-mobile-search-area">
      <form action="#">
        <input type="search" placeholder="Search ..." aria-label="Search" />
        <button type="submit" aria-label="Search">
          <i className="fa fa-search" />
        </button>
      </form>
    </div>
  );
};

export default MobileSearch;
