import { api } from "@app/api";
import { createSelector } from "@app/fx";
import { defaultEntity, defaultHalHref, extractIdFromLink } from "@app/hal";
import { schema } from "@app/schema";
import { TextVal, escapeRegExp } from "@app/string-utils";
import {
  DeployApp,
  DeployAppConfig,
  DeployAppConfigEnv,
  DeployDatabase,
  LinkResponse,
} from "@app/types";
import { parse } from "dotenv";
import { selectAppById, selectStackByAppId } from "../app";
import { selectDatabasesAsList } from "../database";

export interface DeployConfigurationResponse {
  id: number;
  env: { [key: string]: string | null } | null;
  _links: {
    resource: LinkResponse;
  };
  _type: "configuration";
}

export const defaultConfigurationResponse = (
  c: Partial<DeployConfigurationResponse> = {},
): DeployConfigurationResponse => {
  return {
    id: 0,
    env: {},
    _links: {
      resource: defaultHalHref(),
    },
    _type: "configuration",
    ...c,
  };
};

export const deserializeAppConfig = (
  resp: DeployConfigurationResponse,
): DeployAppConfig => {
  return {
    id: `${resp.id}`,
    env: resp.env || {},
    appId: extractIdFromLink(resp._links.resource),
  };
};

export const configEnvToStr = (env: DeployAppConfigEnv): string => {
  return Object.keys(env)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      let value = String.raw`${env[key]}`;
      const prev = acc ? `${acc}\n` : "";
      if (value.includes("\n")) {
        value = `"${value}"`;
      }
      return `${prev}${key}=${value}`;
    }, "");
};

export const configStrToEnvList = (text: string): TextVal[] => {
  const items: TextVal[] = [];
  const output = parse(text);
  Object.keys(output).forEach((key) => {
    items.push({ key, value: output[key], meta: {} });
  });
  return items;
};

export const configEnvListToEnv = (
  next: TextVal[],
  cur: DeployAppConfigEnv = {},
): DeployAppConfigEnv => {
  const env: DeployAppConfigEnv = {};
  // the way to "remove" env vars from config is to set them as empty
  // so we do that here
  Object.keys(cur).forEach((key) => {
    env[key] = "";
  });

  next.forEach((e) => {
    env[e.key] = e.value;
  });

  return env;
};

export const selectAppConfigById = schema.appConfigs.selectById;

export const selectAppConfigByAppId = createSelector(
  schema.appConfigs.selectTable,
  selectAppById,
  (configs, app) =>
    schema.appConfigs.findById(configs, { id: app.currentConfigurationId }),
);

export interface DepNode {
  type: "db";
  key: string;
  value: string;
  refId: string;
}

function createDepGraph(
  env: DeployAppConfigEnv,
  aptibleDbRe: RegExp,
): DepNode[] {
  const deps: DepNode[] = [];
  Object.keys(env).forEach((key) => {
    const value = env[key];
    if (typeof value !== "string") return;
    const match = aptibleDbRe.exec(value);
    if (match && match.length > 1) {
      deps.push({ key, value, refId: match[1], type: "db" });
    }
  });
  return deps;
}

export interface DepGraphDb extends DeployDatabase {
  why: DepNode;
}

export const selectDepGraphDatabases = createSelector(
  selectStackByAppId,
  selectAppConfigByAppId,
  selectDatabasesAsList,
  (stack, config, dbs) => {
    const graphDbs: Record<string, DepGraphDb> = {};
    const domain = escapeRegExp(stack.internalDomain);
    const dbRe = new RegExp(`(\\d+)\\.${domain}\\:`);
    const graph = createDepGraph(config.env, dbRe);

    for (let i = 0; i < graph.length; i += 1) {
      const node = graph[i];
      const found = dbs.find((db) => {
        if (node.type !== "db") {
          return false;
        }
        return node.refId === db.id;
      });
      if (found) {
        graphDbs[found.id] = { ...found, why: node };
      }
    }

    return Object.values(graphDbs);
  },
);

export interface DepGraphApp extends DeployApp {
  why: DepNode;
}

export const fetchConfiguration = api.get<
  { id: string },
  DeployConfigurationResponse
>("/configurations/:id");

export const appConfigEntities = {
  configuration: defaultEntity({
    id: "configuration",
    deserialize: deserializeAppConfig,
    save: schema.appConfigs.add,
  }),
};
