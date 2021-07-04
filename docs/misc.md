## Keyboard shortcuts

It's possible to assign keybindings for often performed actions. Some of the most useful:

- `commands.openAsQuickPick` - show all commands in Quick Pick
- `commands.tree.focus` - focus the main Tree View

## Running sequence without adding it to `settings.json`

If the only purpose for a command sequence is to run it from a keybinding, then it might be easier to just run it from a `keybindings.json` file directly:

```js
{
    "key": "ctrl+shift+9",
    "command": "commands.run",
    "args": [
        "editor.action.toggleMinimap",
        "workbench.action.toggleSidebarVisibility"
    ]
}
```

## Codicons

To quickly find an icon (for Tree View or Status Bar) there's an extension that can show all codicons (with preview) and insert picked id into the editor:

[Codicon Names](https://marketplace.visualstudio.com/items?itemName=usernamehw.codicon-names)

![Codicon Names](https://github.com/usernamehw/vscode-codicon-names/raw/HEAD/img/demo.png)

<!--

## Maybe

Changing some of the visual look of VSCode with [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css)

emoji ➡
monospace label
monospace status bar
padding status bar
ligatures

-->
