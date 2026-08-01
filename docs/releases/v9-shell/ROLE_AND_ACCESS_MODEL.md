# Role and Access Model

TableGate community admission and TTRPG participation are deliberately separate.

## Role order

1. **Owner**
2. **Admin**
3. **Moderator**
4. **Player**
5. **Visitor**

The member rail always groups people by their own role. The current viewer’s permissions never relabel other members.

## Owner

The Owner is the protected creator/owner role. The shell treats the Owner separately from ordinary Admins and never exposes a peer-admin demotion or removal control for the Owner.

Visible shell controls include:

- Full TableGate settings
- Membership-request review
- Player-application review
- Channel creation
- Member moderation
- Invite creation
- All ordinary messaging and participation functions

Central Trust and Safety actions remain outside local ownership control.

## Admin

Admins receive the backend’s full permission mask and can manage the TableGate without being presented as the protected Owner.

The Admin title can be configured as Admin, DM, GM, MOL, Master of Lore, Keeper, Storyteller, Referee, Facilitator, Host, or another chosen title. None is treated as the universal default.

## Moderator

The Moderator role uses the backend’s exact combined permission model:

- All Player permissions
- Manage channels
- Manage messages
- Kick members
- Ban members
- Create invites
- Manage nicknames
- View audit log
- Manage handouts
- Manage systems
- Manage characters

Moderators can perform ordinary group moderation, but the shell does not show Owner/Admin-only TableGate settings or application approval controls to them.

## Player

Players can:

- Send and read messages
- Connect and speak in allowed voice spaces
- Attach files
- Stream
- Use personas
- Roll dice
- Use system mechanics

The social shell exposes messaging and participation state but does not attempt to recreate the full character-sheet, dice, VTT, map, or campaign-authoring application.

## Visitor

Visitors can:

- Read allowed messages
- Connect to allowed voice spaces in observe/listen mode
- Chat only in channels explicitly marked `CHAT`
- Read channels marked `READ`
- Observe channels marked `OBSERVE`
- Remain unable to access channels marked hidden/none
- Submit a separate Player application
- Block, report, leave, and use safety controls regardless of group role

Visitors do not gain Player abilities merely by entering a public group.

## Two-stage joining

### Stage 1: community membership

- Public all-ages group with open access: join immediately as Visitor
- Request-only group: submit a membership request
- Invite-only group: join through a valid invite under backend rules
- 18+ group: backend age-assurance and approval rules still apply

### Stage 2: TTRPG participation

A Visitor submits a Player application. Owner/Admin approval changes the member to Player and unlocks the backend’s Player permission mask.

The shell keeps the two queues separate:

- **Membership requests** approve entry as Visitor
- **Player applications** approve participation as Player

## Channel-level Visitor modes

| Mode | Visitor behavior |
|---|---|
| `CHAT` | Read and send messages |
| `READ` | Read only |
| `OBSERVE` | Observe session/world content without participating |
| `NONE` or private exclusion | Not exposed to the Visitor |

## Safety role neutrality

Owner, Admin, Moderator, Player, Visitor, and custom host titles receive the same block/report rules. Local role power does not provide immunity, and reports involving local leadership are represented as central-review matters rather than local-only disputes.
