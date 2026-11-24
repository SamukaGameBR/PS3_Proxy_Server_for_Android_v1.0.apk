# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Identity Isolation**: A non-admin user can only read and update their own `users/{userId}` and `userSettings/{userId}` documents, and can only read/claim `subscriptions/{subscriptionId}` where `ownerUid == request.auth.uid` or `userEmail == request.auth.token.email` (with `email_verified == true`).
2. **Role Escalation Prevention**: Non-admin users MUST always create `users/{userId}` with `role == 'user'` and cannot modify `role` on update.
3. **Subscription Tamper Prevention**: Non-admin users CANNOT extend `expiresAt`, modify `daysOfUse`, modify `monthlyPriceBrl` / `totalPriceBrl`, or change `status` back to `'active'` after expiration or admin block. Non-admin self-registration is strictly capped at a 3-day trial (`daysOfUse <= 3`, `expiresAt <= request.time + duration.value(3, 'd')`) on doc `subscriptions/$(request.auth.uid)`.
4. **Automatic Expiration Enforcement**: Once `request.time >= expiresAt`, the user may only transition `status` from `'active'` to `'expired'` (or remain blocked) and cannot reactivate without an Admin (`samucac3@gmail.com`).
5. **Email Verification**: All authenticated reads and writes require `request.auth.token.email_verified == true`.
6. **Strict Schema & Bounds**: Every string field has `.size()` bounds; unknown ghost fields are rejected via `hasAll` / `hasOnly` and `affectedKeys().hasOnly(...)`; `createdAt` / `uid` are immutable.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read of `/users/uid1` -> DENIED
2. Non-owner read of `/users/otherUid` -> DENIED
3. Self-escalation create `/users/uid1` with `role: "admin"` -> DENIED
4. Shadow/ghost field create `/users/uid1` with `isVerified: true` -> DENIED
5. Unverified email (`email_verified: false`) attempting write on `/users/uid1` -> DENIED
6. Non-admin creating `/plans/pro` -> DENIED
7. Non-admin updating `/subscriptions/uid1` to extend `expiresAt` by 365 days -> DENIED
8. Non-admin updating `/subscriptions/uid1` `status` from `'expired'` or `'blocked'` back to `'active'` -> DENIED
9. Non-admin self-creating `/subscriptions/uid1` with `daysOfUse: 30` (exceeding 3-day trial cap) -> DENIED
10. Non-admin listing all `/subscriptions` without matching `ownerUid` or `userEmail` -> DENIED
11. Oversized ID path `/users/<200-char-id>` -> DENIED by `isValidId`
12. Spoofed client timestamp `createdAt` not equal to `request.time` -> DENIED
