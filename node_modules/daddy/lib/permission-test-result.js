import check from 'check-types';

let hastobe = check.assert;

/**
 * A convenience wrapper for test results
 * 
 * @param {Boolean} granted
 * @param {any}     reason
 */
export default function PermissionTestResult(granted, reason) {

  hastobe.boolean(granted);

  this.granted = granted;
  this.reason = reason;

  return this;
}