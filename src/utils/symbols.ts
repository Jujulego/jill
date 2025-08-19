import isUnicodeSupported from 'is-unicode-supported';

const isSupported = !isUnicodeSupported();

export function success(fixed = false) {
  return isSupported ? '✔' : (fixed ? '√ ' : '√');
}

export function error(fixed = false) {
  return isSupported ? '✖' : (fixed ? '× ' : '×');
}
