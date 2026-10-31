# Containment development

Containment targets desktop browsers with keyboard and mouse. The user removed all phone compatibility and future mobile testing on 2026-10-31. Do not add or run phone/touch-only controls, compatibility branches, captures, CI gates or release requirements. Historical mobile evidence remains historical and is not a release blocker.

Preserve desktop resizing, keyboard accessibility, native mouse and keyboard actions, graphics recovery, checkpoint persistence feedback and authored-room checks. Run `npm run verify` for changes; the required browser gates are desktop-only. Do not remove desktop assertions to resolve failures.
