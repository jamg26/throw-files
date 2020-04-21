import React from 'react';
import Header from './components/Header';
import { BrowserRouter, Route } from 'react-router-dom';
import Home from './components/Home';
import Signin from './components/Signin';
import Signup from './components/Signup';
import Feature from './components/Feature';
import Signout from './components/Signout';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Route exact path='/' component={Home} />
      <Route exact path='/signin' component={Signin} />
      <Route exact path='/signup' component={Signup} />
      <Route exact path='/signout' component={Signout} />
      <Route exact path='/feature' component={Feature} />
    </BrowserRouter>
  );
}

export default App;
