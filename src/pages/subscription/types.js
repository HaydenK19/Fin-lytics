// src/types.js

/**
 * @typedef {Object} Plan
 * @property {string} title
 * @property {string} price
 * @property {string[]} features
 */

/**
 * @typedef {Object} SubscriptionStatus
 * @property {boolean} has_subscription
 * @property {string | null} subscription_status
 * @property {string | null} subscription_id
 * @property {string | null} next_billing_date
 * @property {string | null} cancel_at
 * @property {string | null} current_period_end
 */

// This file exists mostly for JSDoc / editor intellisense.
// No runtime exports are strictly required, but we can export an empty object.
export {};
