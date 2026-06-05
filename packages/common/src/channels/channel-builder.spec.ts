import { describe, it, expect } from 'vitest';
import {
  buildChannel,
  createChannelBuilder,
  parseChannel,
} from './channel-builder';

describe('channel-builder', () => {
  describe('buildChannel', () => {
    it('should build a valid channel string', () => {
      expect(buildChannel('window', 'main', 'focus')).toBe('window:main.focus');
      expect(buildChannel('menu', 'app', 'itemClicked')).toBe(
        'menu:app.itemClicked',
      );
    });

    it('should throw if any parameter is missing', () => {
      expect(() => buildChannel('', 'main', 'focus')).toThrow();
      expect(() => buildChannel('window', '', 'focus')).toThrow();
      expect(() => buildChannel('window', 'main', '')).toThrow();
    });
  });

  describe('createChannelBuilder', () => {
    it('should create a scoped builder', () => {
      const buildWindowChannel = createChannelBuilder('window');
      expect(buildWindowChannel('main', 'focus')).toBe('window:main.focus');
      expect(buildWindowChannel('settings', 'resize')).toBe(
        'window:settings.resize',
      );
    });

    it('should create independent builders', () => {
      const buildWindowChannel = createChannelBuilder('window');
      const buildMenuChannel = createChannelBuilder('menu');

      expect(buildWindowChannel('main', 'focus')).toBe('window:main.focus');
      expect(buildMenuChannel('app', 'click')).toBe('menu:app.click');
    });
  });

  describe('parseChannel', () => {
    it('should parse a valid channel string', () => {
      expect(parseChannel('window:main.focus')).toEqual({
        scope: 'window',
        identifier: 'main',
        operation: 'focus',
      });

      expect(parseChannel('menu:app.itemClicked')).toEqual({
        scope: 'menu',
        identifier: 'app',
        operation: 'itemClicked',
      });
    });

    it('should handle operations with dots', () => {
      expect(parseChannel('system:state.item.changed')).toEqual({
        scope: 'system',
        identifier: 'state',
        operation: 'item.changed',
      });
    });

    it('should return null for invalid format', () => {
      expect(parseChannel('invalid')).toBeNull();
      expect(parseChannel('no-colon.here')).toBeNull();
      expect(parseChannel('no:dot-here')).toBeNull();
      expect(parseChannel(':missing.scope')).toBeNull();
      expect(parseChannel('missing:.identifier')).toBeNull();
    });
  });

  describe('integration', () => {
    it('should build and parse correctly', () => {
      const channel = buildChannel('window', 'main', 'focus');
      const parsed = parseChannel(channel);

      expect(parsed).toEqual({
        scope: 'window',
        identifier: 'main',
        operation: 'focus',
      });
    });

    it('should work with scoped builder', () => {
      const buildWindowChannel = createChannelBuilder('window');
      const channel = buildWindowChannel('settings', 'resize');
      const parsed = parseChannel(channel);

      expect(parsed).toEqual({
        scope: 'window',
        identifier: 'settings',
        operation: 'resize',
      });
    });
  });
});
