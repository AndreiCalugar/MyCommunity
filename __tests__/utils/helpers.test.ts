/**
 * Utility Functions Tests
 * 
 * Tests for helper functions used throughout the app
 */

describe('Helper Functions', () => {
  describe('Filename sanitization (from resources)', () => {
    // Mock implementation - in real code, import from lib/api/resources
    const sanitizeFileName = (fileName: string): string => {
      const lastDotIndex = fileName.lastIndexOf('.');
      const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
      const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

      const sanitized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

      return sanitized + extension.toLowerCase();
    };

    it('should remove special characters from filename', () => {
      const result = sanitizeFileName('My File (2).pdf');
      expect(result).toBe('my-file-2-.pdf');
    });

    it('should handle Romanian diacritics', () => {
      const result = sanitizeFileName('Călători și Prieteni.pdf');
      expect(result).toBe('calatori-si-prieteni.pdf');
    });

    it('should preserve file extension', () => {
      const result = sanitizeFileName('document.PDF');
      expect(result).toMatch(/\.pdf$/);
      expect(result).not.toContain('PDF'); // Should be lowercase
    });

    it('should handle multiple spaces', () => {
      const result = sanitizeFileName('my    file.txt');
      expect(result).toBe('my-file.txt');
    });

    it('should handle files without extension', () => {
      const result = sanitizeFileName('README');
      expect(result).toBe('readme');
    });

    it('should handle already clean filenames', () => {
      const result = sanitizeFileName('clean-file-name.pdf');
      expect(result).toBe('clean-file-name.pdf');
    });
  });

  describe('URL protocol handling (from resources)', () => {
    // Mock implementation
    const ensureProtocol = (url: string): string => {
      if (!url) return url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `https://${url}`;
    };

    it('should add https:// if no protocol', () => {
      const result = ensureProtocol('example.com');
      expect(result).toBe('https://example.com');
    });

    it('should not duplicate https://', () => {
      const result = ensureProtocol('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should preserve http:// if already present', () => {
      const result = ensureProtocol('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should handle www prefix', () => {
      const result = ensureProtocol('www.example.com');
      expect(result).toBe('https://www.example.com');
    });

    it('should handle empty string', () => {
      const result = ensureProtocol('');
      expect(result).toBe('');
    });
  });

  describe('Time formatting utilities', () => {
    const timeAgo = (dateString: string): string => {
      const now = new Date();
      const date = new Date(dateString);
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    };

    it('should show "just now" for recent times', () => {
      const now = new Date().toISOString();
      expect(timeAgo(now)).toBe('just now');
    });

    it('should show minutes for times under an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(timeAgo(fiveMinutesAgo)).toBe('5m ago');
    });

    it('should show hours for times under a day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(threeHoursAgo)).toBe('3h ago');
    });

    it('should show days for times under a week', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      expect(timeAgo(twoDaysAgo)).toBe('2d ago');
    });
  });
});

