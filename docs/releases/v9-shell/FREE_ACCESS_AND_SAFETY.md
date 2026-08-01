# Free Access and Safety Guardrails

## Free-access rule

The shell contains no paywall, subscription, premium tier, paid boost, paid ranking, paid introduction, booking fee, paid seat, paid Right Now quota, or premium safety/accessibility control.

The following are presented as free core actions:

- Register and sign in
- Create, own, administer, join, or leave a TableGate
- Search public groups
- Use Group Finder and compatibility filters
- Create posts and submit Interests/applications
- Message after the applicable consent or group-access step
- Create and manage channels
- Block, hide, report, and preserve platform evidence
- Use safety, privacy, age, content-boundary, and accessibility controls

`js/config.js` contains the visible free-access promise, and `json/free_access_policy.json` provides a machine-readable policy manifest.

## Safety controls surfaced in the shell

- Block from profiles, friend cards, and member panels
- Report from users, posts, and messages
- Safety Center with report tracker
- Separate local moderation from central severe-case review
- Clear warning that compatibility is not safety clearance
- Public-place anchor model for in-person discovery
- Right Now reminder that urgency does not bypass screening
- No residential-address field in public discovery cards
- No requirement to confront or mediate with a reported person
- Warning not to download, duplicate, forward, screenshot, or re-upload suspected child sexual exploitation material already held by TableGate

## Data handling boundaries represented in the interface

- Public in-person discovery uses a named public anchor and coarse radius
- The interface labels saved anchors as public places
- User blocks sever direct contact and discovery visibility while preserving backend evidence
- Raw identity documents are not requested by this shell
- 18+ verification remains a third-party age-status flow owned by the backend design

## Important implementation boundary

A frontend cannot independently provide secure evidence retention, legal holds, abuse investigation, age assurance, emergency response, or trained Trust and Safety review. Those require backend policy, access control, storage, staffing, legal review, and operational procedures. The shell accurately exposes the supplied backend’s reporting and role-separation surfaces without claiming that UI alone guarantees safety.
