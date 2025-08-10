import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div>
      <nav>
        {/* Use absolute paths from the sub-app's routing root */}
        <Link to="">Overview</Link> | <Link to="details">Details</Link>
      </nav>
      <hr />
      {/* Child pages will render here */}
      <Outlet />
    </div>
  );
};

export default Layout;
