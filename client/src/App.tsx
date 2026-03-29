import { BrowserRouter, Route } from 'react-router-dom';
import { Home } from './pages';
import './App.less';
import PrivacyPolicy from './pages/privacy-policy';
import { Header } from './components/header';
import { ToastProvider } from './components/toast';
import { ThemeProvider } from './contexts/theme';

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <ToastProvider>
                    <Header />
                    <Route exact path='/' component={Home} />
                    <Route exact path='/privacy-policy' component={PrivacyPolicy} />
                </ToastProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
