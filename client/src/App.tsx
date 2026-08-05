import { BrowserRouter, Switch, Route } from "react-router-dom";
import { Home } from "./pages";
import "./App.less";
import PrivacyPolicy from "./pages/privacy-policy/index";
import NotFound from "./pages/not-found/index";
import { Header } from "./components/header";
import { ThemeProvider } from "./contexts/theme";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Header />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          {/* Without a catch-all, any other path rendered a blank page. */}
          <Route component={NotFound} />
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
