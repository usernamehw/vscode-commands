
<table>
    <thead>
        <tr>
            <th>Example</th>
            <th>Demo</th>
        </tr>
    </thead>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Status Bar granular zoom in/out buttons

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

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Replace Activity Bar with icons in Status Bar

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

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Show project name(workspace folder) in status bar

```js
"Workspace folder": {
    "command": "workbench.action.openRecent",
    "statusBar": {
        "text": "|${workspaceFolderBasename}|",
    },
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Show time in status bar

```js
"Time": {
    "command": "noop",
    "statusBar": {
        "text": "${currentHour}:${currentMinute}:${currentSecond}",
        "updateEvents": [
            {
                "kind": "interval",
                "value": 1000,
            },
        ],
    },
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Search for to-do items in opened workspace

```js
"Search for to-do": {
    "command": "workbench.action.findInFiles",
    "args": {
        "query": "TODO|FIXME",
        "isRegex": true,
        "triggerSearch": true,
    },
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Open website query from selection

```js
"Search for selected text": {
    "command": "commands.openExternal",
    "args": "https://www.google.com/search?q=${selectedText}",
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Open first search item (feeling lucky) from selection

```js
"Feeling lucky": {
    "command": "commands.openExternal",
    "args": "https://duckduckgo.com/?q=%21+${selectedText}",
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Run cli command with prompts

```js
"Create vite project": {
    "command": "commands.runInTerminal",
    "args": {
        "text": "npm create vite@latest ${input:folderName} -- --template ${input:template}",
        "reveal": true,
        "reuse": "newest",
    },
    "inputs": [
        {
            "type": "promptString",
            "id": "folderName",
            "description": "Enter folder name.",
        },
        {
            "type": "pickString",
            "id": "template",
            "description": "Pick template.",
            "options": [
                "react",
                "react-ts",
                "vue",
                "vue-ts",
                "svelte",
                "svelte-ts",
            ],
        },
    ],
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->
<tr>
<td>

## Set setting to specific value (prompt + convertType)

```js
"Set editor font size": {
    "command": "commands.toggleSetting",
    "args": {
        "setting": "editor.fontSize",
        "value": [
            "${input:fontSize}",
        ],
    },
    "inputs": [
        {
            "id": "fontSize",
            "type": "promptString",
            "convertType": "number",
        },
    ],
},
```

</td>
<td>
TODO: gif
</td>
</tr>
<!-- ──────────────────────────────────────────────────────────── -->

</table>
