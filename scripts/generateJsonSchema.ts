import * as fs from 'fs';
import { resolve } from 'path';
import * as TJS from 'typescript-json-schema';

function generateSchema() {
	const settings: TJS.PartialArgs = {
		ref: true,
		ignoreErrors: false,
		topRef: true,
		aliasRef: false,
	};
	const compilerOptions: TJS.CompilerOptions = {
		strictNullChecks: true,
	};
	const program = TJS.getProgramFromFiles([resolve('src/types.ts')], compilerOptions);
	const generator = TJS.buildGenerator(program, settings);

	if (!generator) {
		console.log('💔 Something went wrong, `generator` === null');
		return;
	}
	const decoration = generator.getSchemaForSymbol('TopLevelCommands');

	fs.writeFileSync('./generated.json', JSON.stringify(generator.ReffedDefinitions, undefined, '\t'), 'utf8');
}

generateSchema();
