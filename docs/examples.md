## Status bar granular zoom in/out buttons:

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

