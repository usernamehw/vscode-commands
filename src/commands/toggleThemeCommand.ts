import { ColorThemeKind, window } from 'vscode';
import { $config } from '../extension';
import { toggleSetting } from '../settings';

interface ToggleThemeArg {
	dark: string; 
	light: string;
}

export async function toggleThemeCommand(themes: ToggleThemeArg): Promise<void> {
	await toggleSetting(
		{
			setting: 'workbench.colorTheme',
			value: window.activeColorTheme.kind === ColorThemeKind.Light ? themes.light : themes.dark,
		},
		$config.toggleSettings.showNotification,
	);
}
