import {Buffer} from 'node:buffer';

export const simpleFull = 'aaa\nbbb\nccc';
export const simpleChunks = [simpleFull];
export const simpleLines = ['aaa\n', 'bbb\n', 'ccc'];
export const simpleFullEndLines = ['aaa\n', 'bbb\n', 'ccc\n'];
export const noNewlinesChunks = ['aaa', 'bbb', 'ccc'];

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const getEncoding = isUint8Array => isUint8Array ? 'buffer' : 'utf8';

export const stringsToUint8Arrays = (strings, isUint8Array) => isUint8Array
	? strings.map(string => textEncoder.encode(string))
	: strings;

export const stringsToBuffers = (strings, isUint8Array) => isUint8Array
	? strings.map(string => Buffer.from(string))
	: strings;

export const serializeResult = (result, isUint8Array) => Array.isArray(result)
	? result.map(resultItem => serializeResultItem(resultItem, isUint8Array))
	: serializeResultItem(result, isUint8Array);

const serializeResultItem = (resultItem, isUint8Array) => isUint8Array
	? textDecoder.decode(resultItem)
	: resultItem;
