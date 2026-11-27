declare module "bun:test" {
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  export const describe: (name: string, fn: () => void) => void;
  export const expect: (value: unknown) => any;
}
