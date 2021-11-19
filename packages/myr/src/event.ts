// Interfaces
export interface Event<T, A extends string> {
  action: A;
  value: T;
}
