# Character Copy Consent Workflow

1. A campaign runner selects **Create secret copy** on a player-owned character.
2. TableGate creates a separate linked snapshot and a 72-hour approval request.
3. The owning player may approve or reject. Only the owner account can approve.
4. Rejection deletes the copy immediately. No action before the deadline deletes it automatically.
5. Approval retains the private copy. The runner may edit the copied sheet and maintain structured Secret and Rumor entries.
6. Private entries are not visible to the player until **Reveal to player** is selected. Revealed entries are copied to the original character's revealed-lore history.
7. The player may revoke approval later, permanently deleting the runner copy. Previously revealed information remains part of the original character's history.

The record includes campaign ID, original character ID, owner ID, runner ID, creation time, expiration time, approval time, copied state, appearance, and structured entries. Campaign isolation is inherited from the character vault key and backend payload.
