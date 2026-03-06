## 1.22.0 `06 Mar 2026`

- 🐛 Remove notification about disabling variable substitution for workspace items (it's mostly useless since it doesn't check if a command contains any variables)

## 1.21.0 `26 Feb 2026`

- 🐛 Fix Security Vulnerability: Remote Code Execution (RCE) via Status Bar Variable Substitution [Issue#75](https://github.com/usernamehw/vscode-commands/issues/75)

## 1.20.0 `20 Jan 2026`

- ✨ Show Tree View item based on active Text Editor:

```js
"commands.commands": {
    "Match by glob (.tsx)": {
        "command": "noop",
        "activeEditorGlob": "**/*.tsx",
    },
    "Match language (OR / any) (tsx/html)": {
        "command": "noop",
        "activeEditorLanguage": "typescriptreact,html",
    },
},
```

## 1.19.0 `18 Dec 2025`

- 🐛 Cancel command variable replacement when returned value is not a string

## 1.18.0 `08 Dec 2025`

- 🐛 Fix text in status bar not properly updated

## 1.17.0 `08 Dec 2025`

- ✨ Cycle commands:
```js
// settings.json
"commands.cycle": {
	"folding": [
		"editor.foldAll",
		"editor.unfoldAll",
	],
},
// keybindings.json
{
	"key": "ctrl+shift+9",
	"command": "commands.cycle.folding",
},
```
- 🐛 Cancel command execution if variable substitution input was cancelled

## 1.16.0 `03 May 2025`

- ✨ Replace variable value for Status Bar text https://github.com/usernamehw/vscode-commands/issues/50
- ✨ New setting that shows hidden Status Bar items in Tree View `"commands.treeViewStatusBarInvisibleSymbol"`

## 1.15.0 `23 Feb 2025`

- ✨ New Command: `commands.extensionModifiedSettings` **Show modified settings from Extension** - pick any extension and get all modified settings (JSON)
- ✨ "Watch Terminal": Configure alignment/priority for status bar item
- ✨ "Watch Terminal": Configure icon/iconColor for terminal icon
- ✨ "Watch Terminal": Explicit `success` state with `"successWhen"` property
- 🐛 "Watch Terminal": Don't kill terminal on any config change
- 🐛 "Watch Terminal": Wait for `onDidChangeTerminalShellIntegration` event (instead of unreliable timeout)

## 1.14.1 `11 Nov 2024`

- 🔨 Downgrade required VSCode version to **1.93.0**
- ✨ Add warning state for status bar terminal indicator

## 1.14.0 `07 Nov 2024`

- ✨ Status bar terminal indicator for running command (`dev` | `watch`...) `"commands.watchTerminalStatusBar"` [Issue 65](https://github.com/usernamehw/vscode-commands/issues/65)

## 1.13.1 `10 Mar 2024`

- ✨ Support label-value in pickString options [Pull request 62](https://github.com/usernamehw/vscode-commands/pull/62) by [0biWanKenobi](https://github.com/0biWanKenobi)

## 1.13.0 `28 Aug 2023`

- ✨ Suggest workbench color command: `commands.suggestColors`
- ✨ "convertType" property for input of type "promptString" (only "boolean" or "number") [example](https://github.com/usernamehw/vscode-commands/blob/master/docs/examples.md#set-setting-to-specific-value-prompt--converttype)

## 1.12.0 `06 Jun 2023`

- ✨ Support `${command:Name}` variable, like https://code.visualstudio.com/docs/editor/variables-reference#_command-variables
- ✨ Support `${input:Name}` variable, like https://code.visualstudio.com/docs/editor/variables-reference#_input-variables
- ✨ Alias for `${pathSeparator}` - `${/}`

## 1.11.0 `01 May 2023`

- 💥 Enable `"commands.variableSubstitutionEnabled"` by default
- ✨ Add variables: `${currentYear}`, `${currentYearShort}`, `${currentMonth}`, `${currentMonthName}`, `${currentMonthNameShort}`, `${currentDate}`, `${currentDayName}`, `${currentDayNameShort}`, `${currentHour}`, `${currentMinute}`, `${currentSecond}`, `${currentSecondsUnix}`, `${currentTimezoneOffset}`, `${selectedLineCount}`
- ✨ Status bar items now use variable substitution on `"text"` property
- ✨ Status bar now has `"updateEvents"` property that defines when to update its text
- ✨ Commands that require setting names now have autocomplete. New command: `commands.suggestSettings`.

## 1.10.0 `19 Mar 2023`

- ✨ Toggle "statusBar" from inline button in Quick Pick
- ✨ `commands.suggestCodicons` doesn't use hardcoded list of codicons anymore (uses current vscode version list)
- ✨ `${userHome}` variable substitution
- ✨ `commands.openExternal` & `commands.openFolder` to be able to accept array "args"
- 🐛 Status bar folder hover should include commands from all of the nested levels (recursive)
- 💥 Document link args must be valid json now: `@commands.runInTerminal?ls@` => @commands.runInTerminal?"ls"@. Consequently, object/array args allowed in document links.

## 1.9.0 `07 Mar 2023`

- ✨ Add `New folder inside folder` command and inline icon. Allow multiple nesting levels.
- ✨ New command: `commands.focusTerminal` and new properties: "reuse"/"waitForExit"/"icon"/"iconColor" for `commands.runInTerminal` command [Pull request 45](https://github.com/usernamehw/vscode-commands/pull/45) by [frypf](https://github.com/frypf)
- ✨ New command `commands.suggestCodicons` Commands: Suggest (autocomplete) codicons
- ✨ `${random}` & `${randomHex}` variable substitutions
- ✨ Improve autocomplete in `settings.json` - "icon" & "iconColor" have completions now
- 🔨 Prefer workspace extension kind for remote #43

## 1.8.0 `17 Feb 2023`

- ✨ Improve autocomplete in `settings.json`. Add autocomplete for "command" & "args" properties
- ✨ Allow relative path for `commands.openFolder` command
- ✨ New `${clipboard}` variable substitution
- ✨ `${config:...}` variable substitution stringifies(json) arrays & objects now

## 1.7.0 `10 Feb 2023`

- ✨ Make extension available on the web
- ✨ Add autocomplete in `keybindings.json` for "args" when using `commands.run`

## 1.6.0 `10 Nov 2022`

- ✨ Mark workspace commands in tree view `"commands.treeViewWorkspaceCommandSymbol": "🎯",`
- ✨ Show keybinding in tree view (when enabled) `"commands.showKeybindings": true,`
- ✨ Custom markdown tooltip that is shown in tree view #40
- 🐛 Don't use json stringify parse for variable substitution #33
- 🐛 Fix status bar conditional visibility wrong for multiple status bar items

## 1.5.0 `25 Sep 2022`

- ✨ Add option to show status bar item depending on active editor language id: `activeEditorLanguage` #36
- 🔨 Show error notification when command failed to run. Show error notifications when command or alias failed to register

## 1.4.0 `30 Aug 2022`

- ✨ Add option to show status bar item depending on active editor: `activeEditorGlob`
- ✨ Add option to repeat command or sequence #30

## 1.3.0 `24 Jul 2022`

- ✨ Experimental: Add all commands to Quick Pick `"commands.quickPickIncludeAllCommands"`
- ✨ Add folder names for nested items in Quick Pick
- ✨ Suggest variable substitute `commands.suggestVariables`
- ✨ Toggle workspace setting with `commands.toggleSetting`
- 🐛 Passing only string should toggle boolean setting for `commands.toggleSetting`

## 1.2.2 `02 Jun 2022`

- ✨ Render icons in quick pick
- 🐛 Toggle setting should work for arrays #29

## 1.2.1 `20 Mar 2022`

- ✨ Variable substition: add configuration variables #25
- ✨ Add `"backgroundColor"` property to status bar item (only `error` or `warning` values available)
- ✨ Add `"name"` property to status bar item (shown in status bar context menu)
- ✨ Add setting to control tree view symbol which indicates that command is visible in the status bar `"commands.treeViewStatusBarVisibleSymbol"`

## 1.2.0 `22 Jan 2022`

- ✨ Support workspace specific command [PR #23](https://github.com/usernamehw/vscode-commands/pull/23) by [elazarcoh](https://github.com/elazarcoh)
- ✨ Show "reveal command in settings" in inline buttons in Quick Pick
- ✨ Show "reveal command in settings" in status bar hover tooltip
- ✨ Show "new command" button in Quick Pick

## 1.1.5 `15 Jan 2022`

- ✨ Support when expression for command palette [PR #22](https://github.com/usernamehw/vscode-commands/pull/22) by [elazarcoh](https://github.com/elazarcoh)
- ✨ Toggle status bar command should only toggle property `hidden` instead of removing the status bar object

## 1.1.4 `17 Nov 2021`

- ✨ Disable tree view tooltip per item #17

## 1.1.3 `13 Nov 2021`

- ✨ Replace variable works inside arrays/objects #9

## 1.1.2 `01 Nov 2021`

- ✨ Create markdown tooltip for status bar item #16
- ✨ New command to escape a command uri argument
- ✨ Substitute environment variables in command args `${env:ENV_VAR}` #9

## 1.1.1 `12 Aug 2021`

- ✨ Aliased commands also show args decoration in command picker
- ✨ Show warning for duplicate command (extension registers commands by their keys, it cannot be the same as any other command id)
- ✨ Show folder's nested items in status bar on hover
- 🐛 Resolve Tree View tooltip only on hover

## 1.1.0 `11 Jul 2021`

- ✨ Rerun last command `commands.rerun`
- ✨ Tree View: show nested items on folder hover
- ✨ Tree View: Add "status bar" description to items that have it
- ✨ Substitute variables #9
- ✨ Suggest commands: use codicon to denote args
- ✨ Allow to specify simplified command #6
- ✨ New command: Show notification in status bar

## 1.0.1 `04 Jul 2021`

- ✨ Return `commands.alias`
- ✨ Delete command from context menu

## 1.0.0 `02 Jul 2021`

- 💥 Remove `commands.alias`
- ✨ Feature: document links [issues/2](https://github.com/usernamehw/vscode-commands/issues/2)
- ✨ Allow command to be a simple string in top most level commands
- ✨ `commands.open` supports opening file/link with specified app
- ✨ Hide item from tree view with `"hidden": true,`
- 🐛 Fix removing commands from Command Palette after disabling `commands.populateCommandPalette`

## 0.0.11 `30 Jun 2021`

- ✨ Allow `sequence` to accept strings
- ✨ Allow adding folders to status bar

## 0.0.10 `19 Jun 2021`

- ✨ Show command as JSON on hover
- ✨ New folder icon
- 💥 Rename `commands.openInApp` to `commands.open`

## 0.0.9 `19 Jun 2021`

- ✨ Open file in default app `commands.openInApp`
- ✨ Reveal item in OS file explorer `commands.revealFileInOS`
- ✨ Select and run any command (without args) `commands.selectAndRun`

## 0.0.8 `07 Jun 2021`

- ✨ Install extension by id command `commands.installExtension`
- 🐛 Fix `populateCommandPalette` setting duplicating commands

## 0.0.7 `28 May 2021`

- ✨ New command `commands.openExternal` - open link in default browser

## 0.0.6 `04 May 2021`

- ✨ New command action automatically adds `args` property
- ✨ New command icon is present in folders

## 0.0.5 `01 May 2021`

- 🐛 Fix icons in other tree views

## 0.0.4 `01 May 2021`

- 💥 Remove `registerCommand` - use key as command id

## 0.0.3 `01 May 2021`

- ✨ New command action

## 0.0.2 `30 Apr 2021`

- ✨ Add more commands with args

## 0.0.1 `29 Apr 2021`

- Initial release