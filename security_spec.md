# QYZVO Core Pilot Security Specification

## Data Invariants
- A BusinessProfile can only be read or modified by its owner.
- A Project must belong to a BusinessProfile and is only accessible to authorized users (for now, simpler: user's own projects).
- ChatHistory is private to the user.

## The Dirty Dozen (Threat Payloads)
1.  **Identity Spoofing**: Attempt to create a BusinessProfile with someone else's `userId` as the document ID.
2.  **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile update.
3.  **Cross-Tenant Read**: Authenticated User A attempts to `get` User B's `businessProfile`.
4.  **Bulk List Scraping**: Attempting a `list` on `businessProfiles` without filters (blanket read).
5.  **Invalid Type Poisoning**: Sending a 2MB string for a KPI `status` field.
6.  **Immutable Field Mutation**: Attempting to change `createdAt` on an existing Project.
7.  **Unverfied User Write**: User with `email_verified: false` attempts to create a Project.
8.  **Orphaned Asset**: Creating a Project with a non-existent BusinessProfile ID reference.
9.  **Timestamp Spoofing**: Sending a client-side `updatedAt` far in the future instead of `request.time`.
10. **Array Explosion**: Sending an array of 5,000 goals to exhaust storage/cost.
11. **Malicious ID**: Using a document ID containing path injection characters (e.g., `../../secrets`).
12. **Status Shortcut**: Moving a project from "Idea" directly to "Completed" (if state transitions were strictly locked - here we allow it but check fields).

## Test Runner (Conceptual Overview)
We will verify these rules using standard Firestore testing libraries and Ensure PERMISSION_DENIED for all malicious attempts.
