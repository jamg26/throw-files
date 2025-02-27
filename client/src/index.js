import { createRoot } from "react-dom/client";
import { useState, useEffect, createContext } from "react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { composeWithDevTools } from "redux-devtools-extension/developmentOnly";
import reducers from "./reducers";
import reduxThunk from "redux-thunk";
import axios from "axios";
import { ThemeProvider } from "styled-components";
import { dark, light } from "@pancakeswap/uikit";
const container = document.getElementById("root");
const root = createRoot(container);

export const ThemeContext = createContext({
  isDarkMode: false, 
  toggleTheme: () => {}
});

axios.interceptors.request.use(function (config) {
  const token = `${localStorage.getItem("token")}`;
  config.headers.Authorization = token;

  return config;
});

const AppWithTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ThemeProvider theme={isDarkMode ? dark : light}>
        <App />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

const store = createStore(
  reducers,
  {
    auth: {
      authenticated: localStorage.getItem("token"),
    },
  },
  composeWithDevTools(applyMiddleware(reduxThunk))
);

root.render(
  <Provider store={store}>
    <AppWithTheme />
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();