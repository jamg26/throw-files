import { createRoot } from "react-dom/client";
import App from "./App";
import { unregisterServiceWorkers } from "./serviceWorker";

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

createRoot(container).render(<App />);

void unregisterServiceWorkers();
