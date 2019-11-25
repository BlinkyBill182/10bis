import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import FirebaseContext, { withFirebase } from './components/Firebase/context';
import Firebase from './components/Firebase/firebase';

ReactDOM.render(
  <FirebaseContext.Provider value={new Firebase()}>
    <App />
  </FirebaseContext.Provider>,
  document.getElementById('root'),
);

export { FirebaseContext, withFirebase };

serviceWorker.unregister();
