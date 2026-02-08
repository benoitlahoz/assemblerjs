import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Assemblage, Assembler } from '../src';

describe('inject deprecation (replaced by provide)', () => {
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should work with the new "provide" option', () => {
    @Assemblage()
    class ServiceA {
      getValue() {
        return 'A';
      }
    }

    @Assemblage({ provide: [[ServiceA]] })
    class ServiceB {
      constructor(public serviceA: ServiceA) {}

      getValue() {
        return this.serviceA.getValue() + 'B';
      }
    }

    const serviceB = Assembler.build(ServiceB);

    expect(serviceB.getValue()).toBe('AB');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should still work with deprecated "inject" option and emit warning', () => {
    @Assemblage()
    class ServiceA {
      getValue() {
        return 'A';
      }
    }

    @Assemblage({ inject: [[ServiceA]] })
    class ServiceB {
      constructor(public serviceA: ServiceA) {}

      getValue() {
        return this.serviceA.getValue() + 'B';
      }
    }

    const serviceB = Assembler.build(ServiceB);

    expect(serviceB.getValue()).toBe('AB');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('inject')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('deprecated')
    );
  });

  it('should prioritize "provide" over "inject" when both are present', () => {
    @Assemblage()
    class ServiceA {
      getValue() {
        return 'A';
      }
    }

    @Assemblage()
    class ServiceX {
      getValue() {
        return 'X';
      }
    }

    @Assemblage({
      inject: [[ServiceX]], // deprecated
      provide: [[ServiceA]], // should take precedence
    })
    class ServiceB {
      constructor(public service: ServiceA) {}

      getValue() {
        return this.service.getValue() + 'B';
      }
    }

    const serviceB = Assembler.build(ServiceB);

    expect(serviceB.getValue()).toBe('AB');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('provide')
    );
  });

  it('should work with configuration in provide option', () => {
    @Assemblage()
    class ConfigService {
      getApiKey() {
        return 'default-key';
      }
    }

    @Assemblage({
      provide: [[ConfigService]],
    })
    class ApiService {
      constructor(public configService: ConfigService) {}

      getApiKey() {
        return this.configService.getApiKey();
      }
    }

    const apiService = Assembler.build(ApiService);

    expect(apiService.getApiKey()).toBe('default-key');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
