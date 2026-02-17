import { createRoot } from "react-dom/client";
import { useEffect, createContext } from "react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { ThemeProvider } from "styled-components";

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");
const root = createRoot(container);

export const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: () => {}
});

const dark = {
  colors: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    cta: '#F43F5E',
    background: '#0F0F23',
    text: '#E2E8F0',
  }
};

const AppWithTheme = () => {
  useEffect(() => {
    document.body.className = "dark-theme";
    localStorage.setItem("theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode: true, toggleTheme: () => {} }}>
      <ThemeProvider theme={dark}>
        <App />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

root.render(
  <AppWithTheme />
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
