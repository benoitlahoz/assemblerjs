// Export abstract classes FIRST to avoid TDZ issues
export * from './window-menu/services/window-registry.abstract';
export * from './window-menu/services/menu-registry.abstract';
export * from './window-menu/services/window-menu-binding-registry.abstract';

// Then export concrete services
export * from './menu/services/menu-controller.service';
export * from './window-menu/services/window-registry.service';
export * from './window-menu/services/menu-registry.service';
export * from './window-menu/services/window-menu-binding-registry.service';

// Then modules
export * from './app';
export * from './menu';
export * from './window';
export * from './window-menu';
export * from './ipc';
export * from './system-state';

// Exported last to avoid circular dependencies with app/menu/window
export * from './window/window-orchestration/window-orchestrator.decorator';
export * from './menu/menu-orchestration/menu-orchestrator.decorator';
