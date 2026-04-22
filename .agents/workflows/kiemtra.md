---
description: Perform a security and stability audit on the current project.
---

1. Audit `js/` files for "dangerous" initialization:
- Search for `DB.savePrompts` or `DB.saveSettings` inside `async init()` or `onAuthStateChanged` without proper user interaction or existence checks.

2. Verify Cache-Busting:
- Check `index.html` for script tags without version strings (e.g., `?v=X.Y`).
- Check if existing versions match the current development state.

3. Input Safety Check:
- Review `savePrompt` or `saveMessage` functions for lack of sanitization or size-limit checks.

4. Summarize findings and propose fixes for any detected risks.
