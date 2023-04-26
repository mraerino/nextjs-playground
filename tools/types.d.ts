declare module "regjsgen" {
  import type { RootNode, Features } from "regjsparser";
  export function generate<F extends Features = {}>(ast: RootNode<F>): string;
}
