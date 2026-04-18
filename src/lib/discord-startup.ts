import { getDiscordGateway } from './discord-gateway';

// Stored on globalThis so the guard survives across module instances. Under
// `output: 'standalone'` webpack splits API routes into separate chunks, and
// a module-level `let isInitialized` gets duplicated per chunk — leading to
// multiple gateway connections (see note in discord-gateway.ts).
declare global {
  var __komplexaciDiscordGatewayInit: boolean | undefined;
}

export async function initializeDiscordGateway() {
  if (globalThis.__komplexaciDiscordGatewayInit) {
    return;
  }

  // Only initialize on server-side
  if (typeof window !== 'undefined') {
    return;
  }

  // Mark as initializing up-front so concurrent callers (parallel API
  // requests during cold-start) don't each kick off their own connect.
  globalThis.__komplexaciDiscordGatewayInit = true;

  try {
    console.log('Initializing Discord Gateway...');
    const gateway = getDiscordGateway();

    // Connect to Discord Gateway
    await gateway.connect();

    console.log('Discord Gateway initialized successfully');
  } catch (error) {
    // Reset the flag on failure so a retry is possible.
    globalThis.__komplexaciDiscordGatewayInit = false;
    console.error('Failed to initialize Discord Gateway:', error);
    console.log('Discord API will fall back to REST API calls');
  }
}

// Auto-initialize when this module is imported (server-side only)
if (typeof window === 'undefined' &&
    (process.env.NODE_ENV === 'production' || process.env.ENABLE_DISCORD_GATEWAY === 'true')) {
  initializeDiscordGateway();
}
