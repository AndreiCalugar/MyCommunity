# Testing Documentation

## 🧪 Test Structure

```
__tests__/
├── integration/          # Integration tests (full flows)
│   └── direct-messaging.test.ts
├── utils/               # Utility function tests
│   └── helpers.test.ts
└── README.md

lib/api/__tests__/       # API unit tests
└── conversations.test.ts
```

## 🚀 Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci
```

## 📋 Test Coverage Goals

- **Unit Tests**: 70% - Test individual functions and modules
- **Integration Tests**: 20% - Test complete user flows
- **Component Tests**: 10% - Test UI components

## 🎯 Current Test Coverage

### Phase 8A: Direct Messaging
- ✅ `getOrCreateDirectConversation()` - Creates/finds DM conversations
- ✅ `sendMessageToConversation()` - Sends messages with proper structure
- ✅ `markConversationAsRead()` - Updates read timestamps
- ✅ `getUnreadCount()` - Calculates unread messages
- ✅ Filename sanitization - Handles special characters
- ✅ URL protocol handling - Auto-adds https://
- ✅ Integration flow - Complete DM user journey

## 📝 Writing New Tests

### Test File Naming
- Unit tests: `<filename>.test.ts`
- Integration tests: `<feature>.test.ts`
- Place tests in `__tests__` folder next to the code being tested

### Example Test Structure

```typescript
describe('FeatureName', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      // Test edge cases
    });

    it('should handle errors gracefully', () => {
      // Test error scenarios
    });
  });
});
```

## 🔧 Test Configuration

### Jest Config (`jest.config.js`)
- Uses `jest-expo` preset for React Native compatibility
- Transforms ignore patterns for node_modules
- Module name mapper for `@/` imports
- Coverage collection from `lib/` and `components/`

### Jest Setup (`jest.setup.js`)
- Mocks Supabase client
- Mocks Expo modules (router, image-picker, etc.)
- Suppresses console warnings in tests

## 🐛 Troubleshooting

### Tests not finding modules
```bash
# Clear Jest cache
pnpm test --clearCache
```

### Mock not working
- Check `jest.setup.js` has the correct mock
- Ensure mock is defined before imports
- Use `jest.clearAllMocks()` in `beforeEach`

### Transform errors
- Add module to `transformIgnorePatterns` in `jest.config.js`

## 📊 Coverage Reports

After running `pnpm test:coverage`, view the report:
- Terminal: Summary displayed automatically
- HTML: Open `coverage/lcov-report/index.html` in browser
- CI: Coverage uploaded to codecov (if configured)

## ✅ Best Practices

1. **Test behavior, not implementation** - Focus on what the function does, not how
2. **Use descriptive test names** - "should do X when Y" format
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Don't test Supabase, test your code
5. **Test edge cases** - Empty strings, null values, errors
6. **Maintain test quality** - Tests should be as good as production code

## 🎯 Future Tests to Add

- [ ] Component tests for UI elements (UserProfileScreen, DMChatScreen)
- [ ] Real-time subscription tests
- [ ] File upload tests
- [ ] Navigation tests
- [ ] Store/state management tests
- [ ] E2E tests with Detox (future)

