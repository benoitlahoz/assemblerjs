import { describe, expect, it, vi } from 'vitest';
import { WindowMenuBindingRegistryService } from '../src/main/window-menu/services/window-menu-binding-registry.service';

describe('WindowMenuBindingRegistryService', () => {
  it('attaches idempotently for the same menu', async () => {
    const service = new WindowMenuBindingRegistryService();

    const fakeMenu = { id: 'menu' };
    const registerMenu = vi.fn();
    const focus = vi.fn(async () => true);
    const unregisterMenu = vi.fn();

    (service as any).resolveMenuRegistry = () => ({
      resolveMenu: () => fakeMenu,
    });

    (service as any).resolveMenuController = () => ({
      registerMenu,
      focus,
      unregisterMenu,
    });

    const menuToken = class MainMenu {};

    await service.attach('main', menuToken);
    await service.attach('main', menuToken);

    expect(registerMenu).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(service.get('main')?.menu).toBe(menuToken);
  });

  it('detaches safely and is no-op when already detached', () => {
    const service = new WindowMenuBindingRegistryService();

    const unregisterMenu = vi.fn();

    (service as any).resolveMenuController = () => ({
      registerMenu: vi.fn(),
      focus: vi.fn(async () => true),
      unregisterMenu,
    });

    const menuToken = class MainMenu {};
    service.register('main', { menu: menuToken });

    service.detach('main');
    service.detach('main');

    expect(unregisterMenu).toHaveBeenCalledTimes(1);
    expect(service.get('main')).toBeUndefined();
  });
});
