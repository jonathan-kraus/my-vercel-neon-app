// Test feature flags
import { getAllFeatureFlags, getEnabledFeatures } from './app/utils/featureFlags.js';

console.log('All feature flags:', getAllFeatureFlags());
console.log('Enabled features:', getEnabledFeatures());
