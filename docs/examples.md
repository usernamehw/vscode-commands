## Status Bar granular zoom in/out buttons:

```js
"commands.commands": {
    "Zoom in": {
        "icon": "zoom-in",
        "statusBar": {},
        "command": "commands.incrementSetting",
        "args": {
            "setting": "window.zoomLevel",
            "value": 0.1,
        },
    },
    "Zoom out": {
        "icon": "zoom-out",
        "statusBar": {},
        "command": "commands.incrementSetting",
        "args": {
            "setting": "window.zoomLevel",
            "value": -0.1,
        },
    },
},
```

## Replace Activity Bar with icons in Status Bar:

```js
"commands.commands": {
    "File Explorer": {
        "command": "workbench.explorer.fileView.focus",
        "icon": "files",
        "statusBar": {}
    },
    "Search in files": {
        "command": "workbench.view.search.focus",
        "icon": "search",
        "statusBar": {}
    },
    "Source Control": {
        "command": "workbench.scm.focus",
        "icon": "source-control",
        "statusBar": {}
    },
    "Debug": {
        "command": "workbench.view.debug",
        "icon": "debug-alt",
        "statusBar": {}
    },
    "Extensions": {
        "command": "workbench.view.extensions",
        "icon": "extensions",
        "statusBar": {}
    }
}
```

## Open website query from selection:

```js
"commands.commands": {
    "Search for selected text": {
        "command": "commands.openExternal",
        "args": "https://www.google.com/search?q=${selectedText}",
    },
}
```
