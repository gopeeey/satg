export type PickWithOptional<
  T,
  K extends keyof T,
  O extends keyof T = any
> = Pick<T, K> & Partial<Pick<T, O>>;
