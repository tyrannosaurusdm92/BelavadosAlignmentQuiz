# Merge Audit v4

Merged project families:

- TableGate Worldbuilder & VTT v3 as the authoritative shell.
- TableGate complete generator/LifeSimulator project as the campaign-scoped Creator Forge.
- TableGate Unified TTRPG Portal v5 as the campaign-scoped character/session portal.
- Complete Character Sheet Collection: all nine sheets retained through `iframe.srcdoc`, preserving the one-HTML-file requirement.

The two large embedded applications are stored as source assets and loaded only when their workspace is opened. Their global browser-save keys were replaced with campaign-specific keys. Duplicate root messenger code was not activated twice; the outer shell remains authoritative for campaign membership and navigation.
