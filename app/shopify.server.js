import "@shopify/shopify-app-remix/adapters/node";
import {
  AppDistribution,
  shopifyApp,
  BillingInterval,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server.js";

console.log("=== RUNTIME CREDENTIAL CHECK ===");
console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY);
console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET ? "LOADED (hidden)" : "MISSING");
console.log("=================================");

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: "2024-07",
  scopes: process.env.SCOPES ? process.env.SCOPES.split(",") : ["read_products", "read_orders"],
  appUrl: process.env.SHOPIFY_APP_URL || process.env.HOST || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    "Basic": {
      lineItems: [{
        amount: 4.99,
        currencyCode: "USD",
        interval: BillingInterval.Every30Days,
      }],
    },
    "Pro": {
      lineItems: [{
        amount: 9.99,
        currencyCode: "USD",
        interval: BillingInterval.Every30Days,
      }],
    },
  },
  isEmbeddedApp: true,
  useOnlineTokens: true,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const sessionStorage = shopify.sessionStorage;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const registerWebhooks = shopify.registerWebhooks;
export const apiVersion = "2024-01";
