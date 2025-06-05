import "./App.css";
import { ThemeProvider } from "./components/theme.provider";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div>
        <h1>Hello World</h1>
      </div>
    </ThemeProvider>
  );
}

export default App;
