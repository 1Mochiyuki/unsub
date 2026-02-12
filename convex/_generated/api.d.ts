/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as history from "../history.js";
import type * as http from "../http.js";
import type * as rate_limit from "../rate_limit.js";
import type * as test_enc from "../test_enc.js";
import type * as users from "../users.js";
import type * as utils_api from "../utils/api.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_encryption from "../utils/encryption.js";
import type * as youtube from "../youtube.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  config: typeof config;
  history: typeof history;
  http: typeof http;
  rate_limit: typeof rate_limit;
  test_enc: typeof test_enc;
  users: typeof users;
  "utils/api": typeof utils_api;
  "utils/auth": typeof utils_auth;
  "utils/encryption": typeof utils_encryption;
  youtube: typeof youtube;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
