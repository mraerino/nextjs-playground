import fs from "fs/promises";
import {
  AstNode,
  Features,
  Identifier,
  parse as parseRegex,
} from "regjsparser";
import { generate as generateRegex } from "regjsgen";

import type * as NextJS from "./nextjs";

type Constraint =
  | "Country"
  | "Language"
  | "Role"
  | "Cookie"
  | "Accept"
  | `Header@${string}` // todo
  | `Cookie@${string}`; // todo

const transformRegex = (regex: string, destination: string): string => {
  const features: Features = {
    unicodePropertyEscape: true,
    lookbehind: true,
    namedGroups: true,
  };
  const ast = parseRegex(regex, "", features);

  const segments = destination.split("/");
  const parameters = segments
    .filter((s) => s.indexOf(":") != -1)
    .map((s) => {
      const i = s.indexOf(":");
      return s.slice(i + 1);
    });

  let groupIndex = 0;
  const visitor = (node: AstNode<typeof features>) => {
    if (node.type === "group" && node.behavior === "normal") {
      const name = parameters[groupIndex];
      node.name = {
        type: "identifier",
        range: [0, 0],
        raw: name,
        value: name,
      } as any as Identifier;
      groupIndex++;
    }

    // visit children
    if ("body" in node) {
      node.body.forEach(visitor);
    }
  };
  visitor(ast);

  return generateRegex(ast);
};

type Constraints = Partial<Record<Constraint, string | string[]>>;

interface RuleParams {
  scheme?: "http" | "https";
  host?: string;
  to: string;
  params?: Record<string, string>;
  status?: number;
  conditions?: Constraints;
  exceptions?: Constraints;
}

type Rule = (
  | {
      path: string;
    }
  | {
      regex: string;
    }
) &
  RuleParams;

interface RuleSet {
  preEF?: Rule[];
  preCache?: Rule[];
}

const convertConstraints = (
  has: NextJS.Condition[]
): [
  Constraints | undefined,
  Record<string, string> | undefined,
  string[] | undefined
] => {
  let conds: Partial<Record<Constraint, string[]>> | undefined;
  let params: Record<string, string> | undefined;
  let hosts: string[] | undefined;

  for (const cond of has) {
    switch (cond.type) {
      case "host": {
        if (!hosts) {
          hosts = [];
        }
        hosts.push(cond.value);
        break;
      }
      case "header": {
        if (!conds) {
          conds = {};
        }
        conds[`Header@${cond.key}`] = [
          ...(conds[`Header@${cond.key}`] ?? []),
          cond.value || "*",
        ];
        break;
      }
      case "cookie": {
        if (!conds) {
          conds = {};
        }
        conds[`Cookie@${cond.key}`] = [
          ...(conds[`Cookie@${cond.key}`] ?? []),
          cond.value || "*",
        ];
        break;
      }
      case "query": {
        if (!params) {
          params = {};
        }
        params[cond.key] = cond.value || ":any";
      }
    }
  }

  return [conds, params, hosts];
};

const convertRule = <RW extends boolean>(
  rules: NextJS.Rewrite[] | NextJS.Redirect[]
): Rule[] => {
  return rules.flatMap((r) => {
    const [conditions, params, hosts] = convertConstraints(r.has ?? []);
    // todo: what do we do with negative query params or hosts?
    const [exceptions] = convertConstraints(r.missing ?? []);
    const regex = transformRegex(r.regex, r.source);
    let status = 200;
    if ("statusCode" in r) {
      // this is a redirect
      status = r.statusCode || 308; // todo: check default value
    }
    return (hosts || [undefined]).map((host) => ({
      host,
      regex,
      to: r.destination,
      status,
      conditions,
      exceptions,
      params,
    }));
  });
};

const convertRoutes = async (): Promise<RuleSet> => {
  const routesManifest: NextJS.RoutesManifest = JSON.parse(
    await fs.readFile(".next/routes-manifest.json", { encoding: "utf-8" })
  );

  const rulesForRedirects: Rule[] = convertRule(routesManifest.redirects);
  const rulesForBeforeFiles: Rule[] = convertRule(
    Array.isArray(routesManifest.rewrites)
      ? routesManifest.rewrites
      : routesManifest.rewrites.beforeFiles
  );

  console.log(JSON.stringify(rulesForRedirects, null, 2));
  return {
    preEF: rulesForRedirects,
    preCache: rulesForBeforeFiles,
  };
};

convertRoutes();
