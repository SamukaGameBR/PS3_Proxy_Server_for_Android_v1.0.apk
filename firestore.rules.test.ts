/**
 * Dirty Dozen Security Test Specification for firestore.rules
 * Validates the 12 adversarial cases documented in security_spec.md.
 */
export const dirtyDozenCases = [
  { id: 1, name: 'Unauthenticated read of /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Non-owner read of /users/otherUid', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Self-escalation create /users/uid1 with role admin', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow field create /users/uid1 with isVerified: true', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Unverified email write on /users/uid1', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Non-admin creating /plans/pro', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Non-admin extending expiresAt on /subscriptions/uid1', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Non-admin reactivating expired /subscriptions/uid1', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Non-admin self-creating 30-day subscription (exceeds 3-day cap)', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Non-admin blanket listing /subscriptions', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Oversized ID path >128 chars on /users/{id}', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Spoofed createdAt timestamp != request.time', expected: 'PERMISSION_DENIED' },
];
