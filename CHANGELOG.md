## 1.2.2 `02 Jun 2022`

- ✨ feat: render icons in quick pick
- 🐛 fix: toggle setting should work for arrays #29

## 1.2.1 `20 Mar 2022`

- ✨ variable substition: add configuration variables #25
- ✨ add `"backgroundColor"` property to status bar item (only `error` or `warning` values available)
- ✨ add `"name"` property to status bar item (shown in status bar context menu)
- ✨ add setting to control tree view symbol which indicates that command is visible in the status bar `"commands.treeViewStatusBarVisibleSymbol"`

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