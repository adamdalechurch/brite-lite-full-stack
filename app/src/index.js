import React from 'react';
import ReactDOM from 'react-dom/client';
import Sharables from './Sharables';
import Splash from './Splash';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Sharables/>
  </React.StrictMode>
);

const splashRoot = ReactDOM.createRoot(document.getElementById('splash-root'));

splashRoot.render(
  <React.StrictMode>
    <Splash/>
  </React.StrictMode>
);