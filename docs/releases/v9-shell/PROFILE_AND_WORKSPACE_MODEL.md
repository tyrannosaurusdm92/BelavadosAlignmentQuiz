# Profile and TTRPG Workspace Model

## Signed-in flow

1. Authentication remains the entry point.
2. After sign-in, **My Profile** is the default personal social home.
3. **TTRPG Hub** remains a separate operational workspace for creating and joining TableGates, group discovery, direct and channel messaging, sessions, roles, approvals, moderation, and organization.

## Personal profile

The complete supplied profile template is preserved in `tablegate_profile.html` and embedded in the offline `tablegate.html` entry. It retains:

- Edit, Friend, and Public modes
- About Me
- Friends
- Images and videos
- Posts, reactions, and comments
- Games Playing and Games Running
- TTRPG systems
- Profile image, identity, pronouns, location, availability, and play style
- Color, background, overlay, draggable menu, local save, import, and export controls

Profile storage is scoped to the signed-in account identifier when embedded inside TableGate. The first profile display name and handle are seeded from the signed-in account without replacing later user edits.

## Workspace separation

The profile includes navigation bridges, not duplicate group/session tools:

- **TTRPG Hub** opens the existing workspace dashboard.
- **Join Groups** opens public TableGate discovery.
- **Create Group** opens the existing TableGate creation workflow.
- **Messages** opens the existing direct-message workspace.
- Profile Connect buttons route to the existing Friends, Messages, and TTRPG Hub views.

The non-template shell continues to own all actual TTRPG joining, creating, messaging, session, role, moderation, and organization behavior.
