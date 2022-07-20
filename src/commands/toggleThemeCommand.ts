import { ColorThemeKind, window } from 'vscode';
import { toggleSetting } from '../settings';

export async function toggleThemeCommand(themes: { dark: string; light: string }) {
	await toggleSetting({
		setting: 'workbench.colorTheme',
		value: window.activeColorTheme.kind === ColorThemeKind.Light ? themes.light : themes.dark,
	});
}
