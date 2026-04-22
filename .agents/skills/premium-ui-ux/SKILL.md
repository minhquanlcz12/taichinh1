---
name: Premium UI/UX Design
description: Specialized guidelines for high-end, modern web aesthetics and interactive user experiences.
---

# Premium UI/UX Design Skill

This skill focuses on the "WOW" factor of web applications, moving beyond basic functionality to create immersive, premium experiences.

## 1. Advanced Aesthetics

### Mesh & Linear Gradients
- Avoid flat colors. Use mixed gradients: `linear-gradient(135deg, var(--bg) 0%, var(--accent) 100%)`.
- Use "Glow" effects: `box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3);`.

### Glassmorphism v2
- Layering is key. Use different opacities for nested glass elements to create depth.
- Border-light: `border: 1px solid rgba(255, 255, 255, 0.1);` creates a thin, elegant edge.

### Premium Typography
- Use variable fonts (Outfit, Inter).
- Letter spacing: `-0.02em` for headers to make them feel more "tight" and professional.
- Line-height: `1.6` for body text to ensure readability.

## 2. Dynamic Interactions (Micro-Animations)

### Hover Transitions
- **Scale & Lift**: `transform: translateY(-4px) scale(1.02); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);`.
- **Glow Expansion**: Increase box-shadow blur on hover.

### Loading States (Skeleton Screens)
- Instead of "Loading..." text, use animated gray pulse blocks that match the content layout.

### Micro-Feedback
- Button clicks should have a subtle "pressed" scale (`0.95`).
- Success toasts should use slide-in and fade-out animations.

## 3. Layout Patterns

### Bento Grid
- Use varied grid-span sizes (e.g., `grid-column: span 2`) to create a modern, organized information dashboard look.

### Focus Hierarchy
- The most important action (e.g., "Top up", "Save") should always have the brightest gradient and a subtle pulse animation.
