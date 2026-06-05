// Export abstract classes FIRST to avoid TDZ issues
export * from '@/window-menu/main/services/window-registry.abstract';
export * from '@/window-menu/main/services/menu-registry.abstract';
export * from '@/window-menu/main/services/window-menu-binding-registry.abstract';

// Then export concrete services
export * from '@/menu/main/services/menu-controller.service';
export * from '@/window-menu/main/services/window-registry.service';
export * from '@/window-menu/main/services/menu-registry.service';
export * from '@/window-menu/main/services/window-menu-binding-registry.service';

// Then modules
export * from '@/app';
export * from '@/menu/main';
export * from '@/window/main';
export * from '@/window-menu/main';
export * from '@/ipc/main';
export * from '@/system-state/main';

// Exported last to avoid circular dependencies with app/menu/window
export * from '@/window/main/window-orchestration/window-orchestrator.decorator';
export * from '@/menu/main/menu-orchestration/menu-orchestrator.decorator';
