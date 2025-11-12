// Custom Jest resolver to avoid Expo winter runtime issues

module.exports = (path, options) => {
  // Avoid Expo's winter runtime which causes issues in Jest
  if (path.includes('expo/src/winter')) {
    return options.defaultResolver(path.replace('winter/runtime.native', 'winter/runtime'), options);
  }
  
  // Default resolver for everything else
  return options.defaultResolver(path, options);
};

