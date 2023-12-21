import {getStdioOptionType, isRegularUrl, isUnknownStdioString} from './type.js';
import {normalizeStdio} from './normalize.js';
import {handleInputOption, handleInputFileOption} from './input.js';

// Handle `input`, `inputFile`, `stdin`, `stdout` and `stderr` options, before spawning, in async/sync mode
export const handleInput = (addProperties, options) => {
	const stdio = normalizeStdio(options);
	const stdioArray = arrifyStdio(stdio);
	const stdioStreams = stdioArray.map((stdioOption, index) => getStdioStream(stdioOption, index, addProperties, options));
	options.stdio = transformStdio(stdio, stdioStreams);
	return stdioStreams;
};

const arrifyStdio = (stdio = []) => Array.isArray(stdio) ? stdio : [stdio, stdio, stdio];

const getStdioStream = (stdioOption, index, addProperties, {input, inputFile}) => {
	let stdioStream = {
		type: getStdioOptionType(stdioOption),
		value: stdioOption,
		optionName: OPTION_NAMES[index],
		direction: index === 0 ? 'input' : 'output',
	};

	stdioStream = handleInputOption(stdioStream, index, input);
	stdioStream = handleInputFileOption(stdioStream, index, inputFile, input);

	validateFileStdio(stdioStream);

	return {
		...stdioStream,
		...addProperties[stdioStream.direction][stdioStream.type]?.(stdioStream),
	};
};

const OPTION_NAMES = ['stdin', 'stdout', 'stderr'];

const validateFileStdio = ({type, value, optionName}) => {
	if (isRegularUrl(value)) {
		throw new TypeError(`The \`${optionName}: URL\` option must use the \`file:\` scheme.
For example, you can use the \`pathToFileURL()\` method of the \`url\` core module.`);
	}

	if (isUnknownStdioString(type, value)) {
		throw new TypeError(`The \`${optionName}: filePath\` option must either be an absolute file path or start with \`.\`.`);
	}
};

// When the `std*: Iterable | WebStream | URL | filePath`, `input` or `inputFile` option is used, we pipe to `spawned.std*`.
// Therefore the `std*` options must be either `pipe` or `overlapped`. Other values do not set `spawned.std*`.
const transformStdio = (stdio, stdioStreams) => Array.isArray(stdio)
	? stdio.map((stdioItem, index) => transformStdioItem(stdioItem, index, stdioStreams))
	: stdio;

const transformStdioItem = (stdioItem, index, stdioStreams) =>
	stdioStreams[index].type !== 'native' && stdioItem !== 'overlapped' ? 'pipe' : stdioItem;