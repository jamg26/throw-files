// import { Header } from './components';
import { BrowserRouter, Route } from 'react-router-dom';
import {
    Home,
    // Signin, Signup, Signout
} from './pages';
import './App.less';

function App() {
    return (
        <BrowserRouter>
            {/* <Header /> */}
            <Route exact path='/' component={Home} />
            {/* <Route exact path='/signin' component={Signin} />
            <Route exact path='/signup' component={Signup} />
            <Route exact path='/signout' component={Signout} /> */}
        </BrowserRouter>
    );
}

export default App;
