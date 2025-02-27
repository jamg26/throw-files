import { BrowserRouter, Route } from 'react-router-dom';
import { Home } from './pages';
import './App.less';
import PrivacyPolicy from './pages/privacy-policy';

function App() {
    return (
        <BrowserRouter>
            <Route exact path='/' component={Home} />
            <Route exact path='/privacy-policy' component={PrivacyPolicy} />
        </BrowserRouter>
    );
}

export default App;