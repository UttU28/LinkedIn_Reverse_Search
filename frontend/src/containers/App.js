// containers/App.js
import React from 'react';
import AppRoutes from '../routing/Routes';
import Time from '../components/Time';
import Notifications from '../components/Notifications';

function App() {
  return (
    <>
      <Notifications />
      <AppRoutes />
      <Time />
    </>
  );
}

export default App;
