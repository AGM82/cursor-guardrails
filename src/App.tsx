import { Greeting } from "./components/Greeting";
import { formatZar } from "./lib/currency";

export function App() {
  return (
    <main>
      <h1>Cursor Project Guardrails</h1>
      <Greeting name="developer" />
      <p>Example premium: {formatZar(12500)}</p>
    </main>
  );
}
