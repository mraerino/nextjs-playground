export interface RoutesManifest {
  version: number;
  pages404: boolean;
  basePath: string;
  redirects: Redirect[];
  headers: unknown[];
  dynamicRoutes: DynamicRoute[];
  staticRoutes: StaticRoute[];
  dataRoutes: unknown[];
  i18n: I18n;
  rsc: Rsc;
  rewrites: Rewrites | Rewrite[];
}

export type Condition =
  | { type: "host"; value: string }
  | {
      type: "query" | "header" | "cookie";
      key: string;
      value?: string;
    };

export interface RuleBase {
  source: string;
  destination: string;
  has?: Condition[];
  missing?: Condition[];
  regex: string;
  locale?: boolean;
  basePath?: boolean;
}

export interface Redirect extends RuleBase {
  internal?: boolean;
  statusCode?: number;
}

export interface DynamicRoute {
  page: string;
  regex: string;
  routeKeys: Record<string, string>;
  namedRegex: string;
}

export interface StaticRoute {
  page: string;
  regex: string;
  routeKeys: Record<string, string>;
  namedRegex: string;
}

export interface I18n {
  defaultLocale: string;
  locales: string[];
}

export interface Rsc {
  header: string;
  varyHeader: string;
  contentTypeHeader: string;
}

export interface Rewrites {
  beforeFiles: Rewrite[];
  afterFiles: Rewrite[];
  fallback: Rewrite[];
}

export interface Rewrite extends RuleBase {}
