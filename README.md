# Commands

[![Version](https://vsmarketplacebadge.apphb.com/version-short/usernamehw.commands.svg)](https://marketplace.visualstudio.com/items?itemName=usernamehw.commands)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/usernamehw.commands.svg)](https://marketplace.visualstudio.com/items?itemName=usernamehw.commands)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/usernamehw.commands.svg)](https://marketplace.visualstudio.com/items?itemName=usernamehw.commands)
[![Trending](https://vsmarketplacebadge.apphb.com/trending-monthly/usernamehw.commands.svg)](https://marketplace.visualstudio.com/items?itemName=usernamehw.commands)

## Features

- Execute multiple commands; Execute commands with arguments
- Execute commands from Tree View
- Execute commands from Quick Pick
- Add items to Status Bar
- Add items to Command Palette
- Register command to execute from a keybinding
- Additional commands contributed by this extension

```ts
// Command object structure
interface CommandObject {
	command: string;// command id to execute
	args?: unknown;// command arguments to execute
	delay?: number;// delay BEFORE execution
	registerCommand?: string;// register command to execute it from a keybinding
	icon?: string;// icon id https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
	iconColor?: string;// color id https://code.visualstudio.com/api/references/theme-color
	statusBar?: {// add to status bar
		alignment: 'left' | 'right';
		text: string;
		priority?: number;
		tooltip?: string;
		color?: string;
	};

	sequence?: CommandObject[];// execute multipe commands

	nestedItems: {// Group items into a folder (1 lvl max)
		[key: string]: CommandObject
	}
}
```

## Examples

```js
"commands.commands": {
	"Object with \"args\"": {
		"command": "type",
		"args": {
			"text": "!!!",
		},
	},
	// ──────────────────────────────
	"Mutliple Commands": {
		"sequence": [
			{
				"command": "editor.action.toggleMinimap",
			},
			{
				"command": "workbench.action.toggleStatusbarVisibility",
			},
		]
	},
	// ──────────────────────────────
	"Folder": {
		"nestedItems": {
			"togge minimap (nested item)": {
				"command": "editor.action.toggleMinimap",
			},
		},
	},
	// ──────────────────────────────
	"Icon": {
		"command": "help.tweetFeedback",
		"icon": "heart",
		"iconColor": "editorError.foreground",
	},
	// ──────────────────────────────
	"Status Bar Item": {
		"icon": "gear",
		"command": "editor.action.toggleMinimap",
		"statusBar": {
			"alignment": "left",
			"text": "🗺",
			"priority": -9999,
		},
	},
},
```


## [Builtin commands (with args)](https://code.visualstudio.com/api/references/commands)

### `type` Type text into active editor

```js
"Typing": {
	"command": "type",
	"args": {
		"text": "---",
	},
},
```

### `workbench.action.tasks.runTask` Run [task](https://code.visualstudio.com/docs/editor/tasks) by its `label`

```js
// tasks.json
{
	"label": "hello",
	"type": "shell",
	"command": "echo Hello",
},
// commands
"Run task": {
	"command": "workbench.action.tasks.runTask",
	"args": "hello",
},
```

### `editor.action.insertSnippet` Insert [Snippet](https://code.visualstudio.com/docs/editor/userdefinedsnippets)

```js
"Insert snippet": {
	"command": "editor.action.insertSnippet",
	"args": {
		"snippet": "$BLOCK_COMMENT_START ${0:?} $BLOCK_COMMENT_END",
	},
},
```

### `workbench.action.terminal.sendSequence` Send text to active terminal

```js
"Terminal: Run Watch": {
	"command": "workbench.action.terminal.sendSequence",
	"args": {
		"text": "npm run watch\r",
	},
},
```

### `workbench.action.quickOpen` Quick access

Can open Quick Pick with prefilled prefix (`@...` - symbol, `view ...` - open view, ...)

```js
"Quick open (symbol)": {
	"command": "workbench.action.quickOpen",
	"args": "?",
},
```

### `workbench.action.openSettings` Open settings with prefilled input value

```js
"Open Settings": {
	"command": "workbench.action.openSettings",
	"args": "commands",
},
```

### `workbench.action.openGlobalKeybindings` Open keybindings with prefilled value

```js
"Quick Keybindings Editor": {
	"command": "workbench.action.openGlobalKeybindings",
	"args": "commands.",
},
```

### `workbench.extensions.search` Open Extensions View with prefilled value

```js
"Quick Extensions View": {
	"command": "workbench.extensions.search",
	"args": "@builtin",
},
```

### `workbench.action.findInFiles` Open search with specified args

```js
"Search with args": {
	"command": "workbench.action.findInFiles",
	"args": {
		"query": "TODO",
		"isRegex": false,
		"isCaseSensitive": false,
		"matchWholeWord": false,
		"preserveCase": false,
		"excludeSettingAndIgnoreFiles": true,
		"triggerSearch": true,
		// "replace": "",
		// "filesToInclude": "",
		// "filesToExclude": "",
	},
},
```

<!-- ### `search.action.openNewEditor` Open search editor with specified args

```js
"Open search editor with args": {
	"command": "search.action.openNewEditor",
	"args": {
		"query": "TODO",
		"isRegexp": false,
		"isCaseSensitive": false,
		"matchWholeWord": false,
		"preserveCase": false,
		"excludeSettingAndIgnoreFiles": true,
		"triggerSearch": true,
		"contextLines": 2,
		"showIncludesExcludes": true,
		// "filesToInclude": "",
		// "filesToExclude": "",
	},
},
``` -->

### `cursorMove` Move cursor to a logical position in the view

Arguments object:

- **to** A mandatory logical position value providing where to move the cursor.
> 'left', 'right', 'up', 'down'
> 'wrappedLineStart', 'wrappedLineEnd', 'wrappedLineColumnCenter'
> 'wrappedLineFirstNonWhitespaceCharacter', 'wrappedLineLastNonWhitespaceCharacter'
> 'viewPortTop', 'viewPortCenter', 'viewPortBottom', 'viewPortIfOutside'
- **by** Unit to move. Default is computed based on 'to' value.
> 'line', 'wrappedLine', 'character', 'halfLine'
- **value** Number of units to move. Default is '1'.
- **select** If 'true' makes the selection. Default is 'false'.

```js
"Cursor move 10 down": {
	"command": "cursorMove",
	"args": {
		"to": "down",
		"by": "line",
		"value": 10,
	},
},
```

### `editorScroll` Scroll editor in the given direction

Arguments object:

- **to** A mandatory direction value.(`up` or `down`)
- **by** Unit to move. Default is computed based on 'to' value. (`line`, `wrappedLine`, `page`, `halfPage`)
- **value**: Number of units to move. Default is 1.
- **revealCursor**: If 'true' reveals the cursor if it is outside view port.

```js
"Scroll 10 lines down": {
	"command": "editorScroll",
	"args": {
		"to": "down",
		"by": "line",
		"value": 10,
		"revealCursor": true,
	},
},
```


### `moveActiveEditor` Move the active editor by tabs or groups

- **to** String value providing where to move (`left` or `right`)
- **by** String value providing the unit for move (by `tab` or by `group`).
- **value** Number value providing how many positions or an absolute position to move.

```js
"Move editor to the left": {
	"command": "moveActiveEditor",
	"args": {
		"to": "left",
		"by": "tab",
		"value": 50,
	},
},
```

### `editor.emmet.action.wrapWithAbbreviation` Wrap text with emmet

```js
"Wrap in div": {
	"command": "editor.emmet.action.wrapWithAbbreviation",
	"args": {
		"abbreviation": "div",
		"language": "html",
	},
},
```

<!-- ### `vscode.openIssueReporter` Opens the issue reporter with the provided extension id as the selected source.

- **extensionId** - extensionId to report an issue on

```js
"Issue: preselect extension": {
	"command": "vscode.openIssueReporter",
	"args": "usernamehw.commands",
},
``` -->

## Additional commands

### `commands.toggleSetting` Toggle settings

```js
"Toggle indent guides": {
	"command": "commands.toggleSetting",
	"args": "editor.renderIndentGuides",// string - toggle boolean
},
```

```js
"Switch themes": {
	"command": "commands.toggleSetting",
	"args": {
		"setting": "workbench.colorTheme",
		"value": ["Monokai", "Kimbie Dark"],
	},
	"icon": "symbol-color",
},
```

```js
"Set/reset setting": {
	"command": "commands.toggleSetting",
	"args": {
		"setting": "window.zoomLevel",
		"value": [0],
	},
},
```

### `commands.incrementSetting` Increment/decrement setting

```js
"Font size += 2": {
	"command": "commands.incrementSetting",
	"args": {
		"setting": "editor.fontSize",
		"value": 2,
	},
},
```

```js
"Font size -= 2": {
	"command": "commands.incrementSetting",
	"args": {
		"setting": "editor.fontSize",
		"value": -2,
	},
},
```

### `commands.openFolder` Open file/folder in vscode

```js
"Open file": {
	"command": "commands.openFolder",
	"args": "C:\\temp\\temp.txt",
},
"Open folder": {
	"command": "commands.openFolder",
	"args": "C:\\temp",
},
```

### `commands.runInTerminal` Create new terminal and send text

```js
"Terminal => watch (string argument)": {
	"command": "commands.runInTerminal",
	"args": "npm run watch"
},
"Terminal => watch": {
	"command": "commands.runInTerminal",
	"args": {
		"text": "npm run watch",
		"name": "watch",
		"reveal": true,
		// "cwd": "",
	},
},
```

### `commands.setEditorLanguage` Change active editor [language id](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers)

```js
"Set Language JavaScript": {
	"command": "commands.setEditorLanguage",
	"args": "javascript",
},
```

### `commands.clipboardWrite` Write text to clipboard

```js
"Populate clipboard": {
	"command": "commands.clipboardWrite",
	"args": "||||||||",
},
```

### `commands.showNotification` Show VSCode notification

```js
"Msg": {
	"command": "commands.showNotification",
	"args": "info msg",
},
"Msg error": {
	"command": "commands.showNotification",
	"args": {
		"severity": "error",// "warning" | "info"
		"message": "bad",
	},
},
```