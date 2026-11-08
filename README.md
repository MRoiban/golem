# Golem

The product layer of the stack: Onyx is the stone, Anima the soul.

Golem joins [Onyx](https://github.com/MRoiban/onyx) (React primitives with semantic theming) and Anima (animation and interactivity) into one UI layer for Bedrock pebbles:

- **Tokens**: one source that generates Onyx's CSS variables, Anima's theme model and Glyphy's style targets.
- **Components**: Onyx primitives with optional Anima motion parts, falling back to plain Onyx when motion is off or Anima isn't loaded.
- **Bridge**: React wrappers for Anima controls and the theme bridge.
- **App shell**: workbench layout, routing, command palette, keybindings and settings, extracted from the apps that already have them.

Status: just started.
