export type TargetHost = Record<'target', Function>;
export const isTargetEqual = <T extends TargetHost, U extends TargetHost>(a: T, b: U): boolean => {
  return (
    a.target === b.target ||
    (a.target.prototype ? isTargetEqual({ target: (a.target as any).__proto__ }, b) : false)
  );
};
