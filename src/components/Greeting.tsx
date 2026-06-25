export type GreetingProps = {
  /** Name to greet. Kept non-personal in this template (e.g. a role, not a real person). */
  name: string;
};

/**
 * Reference component: functional, typed props, no `any`. New UI should follow
 * this shape and compose from shadcn/ui primitives once the project adds them.
 */
export function Greeting({ name }: GreetingProps) {
  return <p>Hello, {name}. Welcome to the guardrails template.</p>;
}
