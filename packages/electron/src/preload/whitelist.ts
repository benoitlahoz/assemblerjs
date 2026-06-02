import type { AutoWhitelistRule } from './types';

export function matchesAutoWhitelistRule(
  channel: string,
  rule: AutoWhitelistRule,
): boolean {
  if (typeof rule === 'string') {
    return channel === rule;
  }

  if (rule instanceof RegExp) {
    return rule.test(channel);
  }

  return rule(channel);
}

export function isAutoWhitelistedChannel(
  channel: string,
  rules: ReadonlyArray<AutoWhitelistRule>,
): boolean {
  return rules.some((rule) => matchesAutoWhitelistRule(channel, rule));
}

export function autoWhitelistRuleToString(rule: AutoWhitelistRule): string {
  if (typeof rule === 'string') {
    return rule;
  }

  if (rule instanceof RegExp) {
    return rule.toString();
  }

  return '[Function rule]';
}

export function validateChannel(
  channel: string,
  allowedChannels: ReadonlyArray<string>,
  autoWhitelistRules: ReadonlyArray<AutoWhitelistRule>,
  strict = true,
  debug = false,
): void {
  if (
    strict &&
    !allowedChannels.includes(channel) &&
    !isAutoWhitelistedChannel(channel, autoWhitelistRules)
  ) {
    if (debug) {
      console.warn('[assemblerjs/electron][ipc] Rejected channel:', channel);
    }

    throw new Error(
      `IPC channel "${channel}" is not whitelisted. Allowed: [${allowedChannels.join(
        ', ',
      )}]`,
    );
  }
}
