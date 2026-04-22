---
name: Premium Web Development
description: Guidelines and automation for building high-end, dark-themed web applications with Firebase integration.
---

# Premium Web Development Skill

This skill encapsulates the architecture, design, and security patterns developed during the "Thanh Long Finance" project. It is optimized for building "Premium Modern Dark" web applications.

## Core Pillars

### 1. Visual Aesthetics (Modern Dark)
- **Palette**: Deep blacks (`#050a14`), high-contrast primary colors (Neon Cyan/Blue), and subtle accents (Glassmorphism).
- **Glassmorphism**: Use `backdrop-filter: blur(10px);` and `background: rgba(255, 255, 255, 0.03);` for containers.
- **Typography**: Inter or Outfit fonts, with `title-glow` effects.

### 2. Firebase & Data Architecture
- **Global `DB` Interface**: Always use a central `DB.js` to manage Firestore and LocalStorage sync.
- **System Collection**: Use `system/` collection for global configs (settings, accounts, prompts).
- **History Isolation**: Transaction/Activity logs should be isolated from main data points to prevent chart pollution.

### 3. Stability & Security
- **Safe Init**: Never auto-save defaults in `init()` functions. Only load them in memory.
- **Versioning**: Always append version strings (e.g., `?v=X.Y`) to script tags in `index.html` to break cache.
- **Input Sanitization**: Use `DOMPurify` (if available) or manual sanitization for any user-provided prompt content.

## Slash Commands
- `/buidweb`: Scaffold a new project structure.
- `/baomat`: Perform a security and stability audit on the current codebase.
