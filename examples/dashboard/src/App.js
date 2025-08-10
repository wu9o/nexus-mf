import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Overview from './pages/Overview';
import Details from './pages/Details';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="details" element={<Details />} />
      </Route>
    </Routes>
  );
};

export default App;
