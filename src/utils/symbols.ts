import isUnicodeSupported from 'is-unicode-supported';

const isSupported = !isUnicodeSupported();

export const success = isSupported ? '✔' : '✓';
export const error = isSupported ? '✖' : '×';
