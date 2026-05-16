import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Home } from "./pages";
import "./App.less";
import PrivacyPolicy from "./pages/privacy-policy/index";
import { Header } from "./components/header";
import { ToastProvider } from "./components/toast";
import { ThemeProvider } from "./contexts/theme";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <Header />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
          </Switch>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
