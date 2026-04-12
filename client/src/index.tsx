import { createRoot } from "react-dom/client";
import { createContext } from "react";
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
    primary: '#ED4B9E',
    secondary: '#F472B6',
    cta: '#ED4B9E',
    background: '#030014',
    text: '#FFFFFF',
  }
};

root.render(
  <ThemeContext.Provider value={{ isDarkMode: true, toggleTheme: () => {} }}>
    <ThemeProvider theme={dark}>
      <App />
    </ThemeProvider>
  </ThemeContext.Provider>
);

serviceWorker.register();
