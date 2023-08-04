import {
  defaultActivePlanResponse,
  defaultAppResponse,
  defaultBackupRpResponse,
  defaultConfigurationResponse,
  defaultDatabaseImageResponse,
  defaultDatabaseResponse,
  defaultEndpointResponse,
  defaultEnvResponse,
  defaultOperationResponse,
  defaultPermissionResponse,
  defaultPlanResponse,
  defaultServiceResponse,
  defaultStackResponse,
} from "@app/deploy";
import { defaultCodeScanResponse } from "@app/deploy/code-scan-result";
import { createEnv } from "@app/env";
import { defaultHalHref } from "@app/hal";
import { defaultOrgResponse } from "@app/organizations";
import { defaultRoleResponse } from "@app/roles";
import { defaultSshKeyResponse } from "@app/ssh-keys";
import { defaultTokenResponse } from "@app/token";
import { defaultUserResponse } from "@app/users";

const idFactory = () => {
  let id = 1;
  return () => {
    id += 1;
    return id;
  };
};
export const createId = idFactory();
export const createText = (mixin: string, id: string | number = "1") => {
  return `test-${mixin}-${id}`;
};

export const testEnv = createEnv({
  origin: "app",
  authUrl: "https://auth.aptible.com",
  apiUrl: "https://api.aptible.com",
  billingUrl: "https://billing.aptible.com",
  legacyDashboardUrl: "https://dashboard.aptible.com",
  metricTunnelUrl: "https://metrictunnel.aptible.com",
});

export const mockJwtHeaders = btoa(
  JSON.stringify({ alg: "HS256", typ: "JWT" }),
);
const mockJwtPayload = btoa(
  JSON.stringify({ someBackendData: `${testEnv.authUrl}/data` }),
);
export const mockJwt = (mixin: string, id: string | number = "1") =>
  `${mockJwtHeaders}.${mockJwtPayload}.not_real_${mixin}_${id}`;

export const testUserId = createId();

export const testToken = defaultTokenResponse({
  access_token: `${mockJwt(createId().toString())}`,
  id: `${createId()}`,
  _links: {
    self: defaultHalHref(),
    user: defaultHalHref(`${testEnv.authUrl}/users/${testUserId}`),
    actor: defaultHalHref(`${testEnv.authUrl}/users/${testUserId}`),
  },
});

export const testEmail = "test@aptible.com";
export const testUser = defaultUserResponse({
  id: testUserId,
  email: testEmail,
  verified: false,
});
export const testUserVerified = defaultUserResponse({
  id: testUserId,
  email: testEmail,
  verified: true,
});

export const testSshKey = defaultSshKeyResponse({ id: `${createId()}` });

export const testOrg = defaultOrgResponse({
  name: createText("org"),
  id: `${createId()}`,
});
export const testStack = defaultStackResponse({
  id: createId(),
  name: createText("stack"),
  region: "us-east-1",
});

export const testRole = defaultRoleResponse({
  id: `${createId()}`,
  name: "Deploy User",
  type: "platform_user",
  _links: {
    organization: defaultHalHref(testOrg.id),
  },
});

const testAccountId = createId();
export const testAccount = defaultEnvResponse({
  id: testAccountId,
  handle: createText("account"),
  organization_id: testOrg.id,
  _links: {
    stack: defaultHalHref(`${testEnv.apiUrl}/stacks/${testStack.id}`),
    environment: defaultHalHref(),
  },
  _embedded: {
    permissions: [
      defaultPermissionResponse({
        scope: "deploy",
        _links: {
          account: defaultHalHref(
            `${testEnv.apiUrl}/accounts/${testAccountId}`,
          ),
          role: defaultHalHref(`${testEnv.apiUrl}/roles/${testRole.id}`),
        },
      }),
    ],
  },
});

const testAppId = createId();

export const testServiceRails = defaultServiceResponse({
  id: createId(),
  handle: createText("web"),
  command: "rails s",
  _links: {
    current_release: defaultHalHref(),
    app: defaultHalHref(`${testEnv.apiUrl}/apps/${testAppId}`),
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccountId}`),
  },
});
export const testServiceSidekiq = defaultServiceResponse({
  id: createId(),
  handle: createText("background"),
  command: "rake sidekiq",
  _links: {
    current_release: defaultHalHref(),
    app: defaultHalHref(`${testEnv.apiUrl}/apps/${testAppId}`),
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccountId}`),
  },
});

export const testConfiguration = defaultConfigurationResponse({
  id: createId(),
  env: { DATABASE_URL: "{{test-app-1-postgres}}" },
  _links: {
    resource: defaultHalHref(`${testEnv.apiUrl}/apps/${testAppId}`),
  },
});

export const testApp = defaultAppResponse({
  id: testAppId,
  handle: createText("app"),
  _links: {
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccount.id}`),
    current_configuration: defaultHalHref(),
  },
  _embedded: {
    current_image: null,
    last_operation: null,
    last_deploy_operation: null,
    services: [testServiceRails, testServiceSidekiq],
  },
});

export const testScanOperation = defaultOperationResponse({
  id: createId(),
  type: "scan_code",
  status: "succeeded",
  _links: {
    code_scan_result: defaultHalHref(
      `${testEnv.apiUrl}/code_scan_results/${createId()}`,
    ),
    resource: defaultHalHref(`${testEnv.apiUrl}/apps/${testApp.id}`),
    ephemeral_sessions: defaultHalHref(),
    self: defaultHalHref(),
    account: testApp._links.account,
    ssh_portal_connections: defaultHalHref(),
    user: defaultHalHref(),
    logs: defaultHalHref(),
  },
});

export const testCodeScanResult = defaultCodeScanResponse({
  id: createId(),
  dockerfile_present: true,
  _links: {
    app: defaultHalHref(`${testEnv.apiUrl}/apps/${testApp.id}`),
    operation: defaultHalHref(),
  },
});

export const testPostgresDatabaseImage = defaultDatabaseImageResponse({
  id: createId(),
  type: "postgres",
  version: "14",
});

export const testRedisDatabaseImage = defaultDatabaseImageResponse({
  id: createId(),
  type: "redis",
  version: "5",
});

export const testDatabaseId = createId();
export const testDatabasePostgres = defaultDatabaseResponse({
  id: testDatabaseId,
  handle: `${testApp.handle}-postgres`,
  type: "postgres",
  connection_url: "postgres://some:val@wow.com:5432",
  _links: {
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccount.id}`),
    initialize_from: defaultHalHref(),
    database_image: defaultHalHref(
      `${testEnv.apiUrl}/database_images/${testPostgresDatabaseImage.id}`,
    ),
    service: defaultHalHref(),
  },
});

export const testDatabaseOp = defaultOperationResponse({
  id: createId(),
  type: "provision",
  status: "succeeded",
  _links: {
    resource: defaultHalHref(`${testEnv.apiUrl}/databases/${testDatabaseId}`),
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccount.id}`),
    code_scan_result: defaultHalHref(),
    self: defaultHalHref(),
    ssh_portal_connections: defaultHalHref(),
    ephemeral_sessions: defaultHalHref(),
    logs: defaultHalHref(),
    user: defaultHalHref(),
  },
});

export const testEndpoint = defaultEndpointResponse({
  id: createId(),
  _links: {
    service: defaultHalHref(
      `${testEnv.apiUrl}/services/${testServiceRails.id}`,
    ),
    certificate: defaultHalHref(),
  },
});

export const testPlan = defaultPlanResponse({
  id: createId(),
});
export const testEnterprisePlan = defaultPlanResponse({
  id: createId(),
  name: "enterprise",
});

export const testActivePlan = defaultActivePlanResponse({
  id: createId(),
  available_plans: ["growth", "scale"],
  organization_id: testOrg.id,
  _links: {
    organization: defaultHalHref(
      `${testEnv.authUrl}/organizations/${testOrg.id}`,
    ),
    plan: defaultHalHref(`${testEnv.apiUrl}/plans/${testPlan.id}`),
  },
});

export const testEnvExpress = defaultEnvResponse({
  id: createId(),
  organization_id: testOrg.id,
  handle: createText("express"),
  onboarding_status: "initiated",
  _links: {
    stack: defaultHalHref(`${testEnv.apiUrl}/stacks/${testStack.id}`),
    environment: defaultHalHref(),
  },
});
export const testAppDeployedId = createId();
const testAppDeployOperation = defaultOperationResponse({
  id: createId(),
  type: "deploy",
  status: "succeeded",
  updated_at: new Date("2023-04-08T14:00:00.0000").toISOString(),
  _links: {
    resource: defaultHalHref(`${testEnv.apiUrl}/apps/${testAppDeployedId}`),
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testEnvExpress.id}`),
    code_scan_result: defaultHalHref(),
    ephemeral_sessions: defaultHalHref(),
    logs: defaultHalHref(),
    ssh_portal_connections: defaultHalHref(),
    self: defaultHalHref(),
    user: defaultHalHref(),
  },
});
export const testAppDeployed = defaultAppResponse({
  id: testAppDeployedId,
  handle: `${testEnvExpress.handle}-app`,
  _links: {
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testEnvExpress.id}`),
    current_configuration: defaultHalHref(),
  },
  _embedded: {
    services: [],
    current_image: null,
    last_operation: null,
    last_deploy_operation: testAppDeployOperation,
  },
});

export const testOperations = [
  testScanOperation,
  testDatabaseOp,
  testAppDeployOperation,
];

export const testBackupRp = defaultBackupRpResponse({
  id: createId(),
  daily: 1,
  monthly: 5,
  keep_final: true,
  make_copy: false,
  _links: {
    account: defaultHalHref(`${testEnv.apiUrl}/accounts/${testAccountId}`),
  },
});
