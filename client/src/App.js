// import { Header } from './components';
import { BrowserRouter, Route } from 'react-router-dom';
import { Home } from './pages';
import './App.less';

function App() {
    return (
        <BrowserRouter>
            <Route exact path='/' component={Home} />
        </BrowserRouter>
    );
}

export default App;
