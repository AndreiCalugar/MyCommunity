// Mock for Expo modules to avoid winter runtime issues in Jest

module.exports = {
  // Mock common Expo exports
  registerRootComponent: jest.fn(),
  
  // Asset system
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
    })),
  },
  
  // Font loading
  Font: {
    loadAsync: jest.fn(() => Promise.resolve()),
    isLoaded: jest.fn(() => true),
  },
  
  // Splash screen
  SplashScreen: {
    preventAutoHideAsync: jest.fn(() => Promise.resolve()),
    hideAsync: jest.fn(() => Promise.resolve()),
  },
  
  // Constants
  Constants: {
    expoConfig: {},
    manifest: {},
  },
};

