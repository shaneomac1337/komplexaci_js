import { getDiscordGateway } from './discord-gateway';

let isInitialized = false;

export async function initializeDiscordGateway() {
  if (isInitialized) {
    return;
  }

  // Only initialize on server-side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    console.log('Initializing Discord Gateway...');
    const gateway = getDiscordGateway();
    
    // Connect to Discord Gateway
    await gateway.connect();
    
    isInitialized = true;
    console.log('Discord Gateway initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Discord Gateway:', error);
    console.log('Discord API will fall back to REST API calls');
  }
}

// Auto-initialize when this module is imported (server-side only)
if (typeof window === 'undefined' && 
    (process.env.NODE_ENV === 'production' || process.env.ENABLE_DISCORD_GATEWAY === 'true')) {
  initializeDiscordGateway();
}
