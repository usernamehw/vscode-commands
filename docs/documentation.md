

## Variable substitution

<!-- https://code.visualstudio.com/docs/editor/variables-reference -->
<!-- https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables -->
<!-- https://github.com/usernamehw/vscode-commands/issues/9 -->
<!-- [📚 Docs](https://github.com/usernamehw/vscode-commands/blob/master/docs/documentation.md#variable-substitution) -->

Controlled by `"commands.variableSubstitutionEnabled"` setting.

Variable substitution is applied to `"args"` property (recursive) for all commands called by using `commands.run` command.
`commands.run` is also used internally when executing any command defined inside of `"commands.commands"` setting.

This extension uses a combination of VSCode variables used for [Debugging and Tasks](https://code.visualstudio.com/docs/editor/variables-reference), [Snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_variables) and some additional variables.

Variable | Description
--- | ---
`${userHome}` | The path of the user's home folder
`${workspaceFolder}` | The path of the folder opened in VS Code
`${workspaceFolderBasename}` | The name of the folder opened in VS Code without any slashes (/)
`${file}` | The current opened file
`${fileWorkspaceFolder}` | The current opened file's workspace folder
`${relativeFile}` | ❌ The current opened file relative to `workspaceFolder`
`${relativeFileDirname}` | ❌ The current opened file's dirname relative to `workspaceFolder`
`${fileBasename}` | The current opened file's basename
`${fileBasenameNoExtension}` | The current opened file's basename with no file extension
`${fileExtname}` | The current opened file's extension
`${fileDirname}` | The current opened file's dirname
`${fileDirnameBasename}` | ❌ The current opened file's folder name
`${lineNumber}` | The current selected line number in the active file
`${selectedText}` | The current selected text in the active file
`${execPath}` | Location of Code.exe
`${pathSeparator}` | `/` on macOS or linux, `\` on Windows
`${/}` | alias to ${pathSeparator}.  `/` on macOS or linux, `\` on Windows
`${clipboard}` | Current clipboard value
`${random}` | 6 random Base-10 digits
`${randomHex}` | 6 random Base-16 digits
`${currentYear}`| The current year (4 digits)
`${currentYearShort}`| The current year's last two digits
`${currentMonth}`| The month as two digits (example '02')
`${currentMonthName}`| The full name of the month (example 'July')
`${currentMonthNameShort}`| The short name of the month (example 'Jul')
`${currentDate}`| The day of the month as two digits (example '08')
`${currentDayName}`| The name of day (example 'Monday')
`${currentDayNameShort}`| The short name of the day (example 'Mon')
`${currentHour}`| The current hour in 24-hour clock format
`${currentMinute}`| The current minute as two digits
`${currentSecond}`| The current second as two digits
`${currentSecondsUnix}`| The number of seconds since the Unix epoch
`${currentTimezoneOffset}`| The current timezone offset in the format +HHMM or -HHMM (for example `-0700`)
`${selectedLineCount}`| Number of lines with cursor or selected lines. Empty string when only 1 line selected
`${env:Name}`| [Environment variable](https://en.wikipedia.org/wiki/Environment_variable). Example: `${env:USERNAME}`
`${config:Name}`| [VSCode configuration](https://code.visualstudio.com/docs/getstarted/settings#_default-settings) variable. Example: `${config:editor.fontSize}`
`${command:Name}`| [VSCode command](https://code.visualstudio.com/docs/editor/variables-reference#_command-variables) variable. Unlike VSCode command variable - this extension json stringifies Arrays and Objects.

## Document links

Controlled by `"commands.documentLinksEnabled"` setting.

Choose documents with the setting `"commands.documentLinksPattern"` by [glob pattern](https://code.visualstudio.com/api/references/vscode-api#GlobPattern) and run commands as document links.

It has format:

```plaintext
@COMMAND_ID?COMMAND_ARGS@
```

<!-- TODO: add gif -->
