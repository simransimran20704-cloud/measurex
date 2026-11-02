import { runAllVerificationTests } from './measurement.test';

console.log('--- MEASUREX AUTOMATED VERIFICATION SUITE ---');
const results = runAllVerificationTests();
let allPassed = true;

results.forEach((r, idx) => {
  const status = r.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} [${idx + 1}] ${r.test} - ${r.details}`);
  if (!r.passed) allPassed = false;
});

console.log('---------------------------------------------');
if (allPassed) {
  console.log(`ALL ${results.length} VERIFICATION TESTS PASSED!`);
} else {
  console.error('SOME TESTS FAILED!');
  process.exit(1);
}
