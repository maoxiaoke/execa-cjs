<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# 📢 Output

## Stdout and stderr

The [`stdout`](../readme.md#optionsstdout) and [`stderr`](../readme.md#optionsstderr) options redirect the subprocess output. They default to `'pipe'`, which returns the output using [`result.stdout`](../readme.md#resultstdout) and [`result.stderr`](../readme.md#resultstderr).

```js
import {execa} from 'execa';

const {stdout, stderr} = await execa`npm run build`;
console.log(stdout);
console.log(stderr);
```

## Ignore output

```js
const {stdout, stderr} = await execa({stdout: 'ignore'})`npm run build`;
console.log(stdout); // undefined
console.log(stderr); // string with errors
```

## File output

```js
await execa({stdout: {file: './output.txt'}})`npm run build`;
// Or:
await execa({stdout: new URL('file:///path/to/output.txt')})`npm run build`;
```

## Terminal output

The parent process' output can be re-used in the subprocess by passing `'inherit'`. This is especially useful to print to the terminal in command line applications.

```js
await execa({stdout: 'inherit', stderr: 'inherit'})`npm run build`;
```

To redirect from/to a different [file descriptor](https://en.wikipedia.org/wiki/File_descriptor), pass its [number](https://en.wikipedia.org/wiki/Standard_streams) or [`process.stdout`](https://nodejs.org/api/process.html#processstdout)/[`process.stderr`](https://nodejs.org/api/process.html#processstderr).

```js
// Print both stdout/stderr to the parent stdout
await execa({stdout: process.stdout, stderr: process.stdout})`npm run build`;
// Or:
await execa({stdout: 1, stderr: 1})`npm run build`;
```

## Multiple targets

The output can be redirected to multiple targets by setting the [`stdout`](../readme.md#optionsstdout) or [`stderr`](../readme.md#optionsstderr) option to an array of values. This also allows specifying multiple inputs with the [`stdin`](../readme.md#optionsstdin) option.

The following example redirects `stdout` to both the [terminal](#terminal-output) and an `output.txt` [file](#file-output), while also retrieving its value [programmatically](#stdout-and-stderr).

```js
const {stdout} = await execa({stdout: ['inherit', {file: './output.txt'}, 'pipe']})`npm run build`;
console.log(stdout);
```

When combining [`'inherit'`](#terminal-output) with other values, please note that the subprocess will not be an interactive TTY, even if the current process is one.

## Interleaved output

If the [`all`](../readme.md#optionsall) option is `true`, [`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)) and [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)) are combined:
- [`result.all`](../readme.md#resultall): [`result.stdout`](../readme.md#resultstdout) + [`result.stderr`](../readme.md#resultstderr)
- [`subprocess.all`](../readme.md#subprocessall): [`subprocess.stdout`](../readme.md#subprocessstdout) + [`subprocess.stderr`](../readme.md#subprocessstderr)

`stdout` and `stderr` are guaranteed to interleave. However, for performance reasons, the subprocess might buffer and merge multiple simultaneous writes to `stdout` or `stderr`. This can prevent proper interleaving.

For example, this prints `1 3 2` instead of `1 2 3` because both `console.log()` are merged into a single write.

```js
const {all} = await execa({all: true})`node example.js`;
```

```js
// example.js
console.log('1'); // writes to stdout
console.error('2'); // writes to stderr
console.log('3'); // writes to stdout
```

This can be worked around by using `setTimeout()`.

```js
import {setTimeout} from 'timers/promises';

console.log('1');
console.error('2');
await setTimeout(0);
console.log('3');
```

## Stdout/stderr-specific options

Some options are related to the subprocess output: [`verbose`](../readme.md#optionsverbose), [`lines`](../readme.md#optionslines), [`stripFinalNewline`](../readme.md#optionsstripfinalnewline), [`buffer`](../readme.md#optionsbuffer), [`maxBuffer`](../readme.md#optionsmaxbuffer). By default, those options apply to all [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) ([`stdout`](https://en.wikipedia.org/wiki/Standard_streams#Standard_output_(stdout)), [`stderr`](https://en.wikipedia.org/wiki/Standard_streams#Standard_error_(stderr)), and [others](#additional-file-descriptors)). A plain object can be passed instead to apply them to only `stdout`, `stderr`, [`fd3`](#additional-file-descriptors), etc.

```js
// Same value for stdout and stderr
await execa({verbose: 'full'})`npm run build`;

// Different values for stdout and stderr
await execa({verbose: {stdout: 'none', stderr: 'full'}})`npm run build`;
```

## Additional file descriptors

The [`stdio`](../readme.md#optionsstdio) option is an array combining [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout), [`stderr`](../readme.md#optionsstderr) and any other file descriptor. It is useful when using additional [file descriptors](https://en.wikipedia.org/wiki/File_descriptor) beyond the [standard ones](https://en.wikipedia.org/wiki/Standard_streams), either for [input](input.md#additional-file-descriptors) or output.

[`result.stdio`](../readme.md#resultstdio) can be used to retrieve some output from any file descriptor, as opposed to only [`stdout`](../readme.md#optionsstdout) and [`stderr`](../readme.md#optionsstderr).

```js
// Retrieve output from file descriptor number 3
const {stdio} = await execa({
	stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
})`npm run build`;
console.log(stdio[3]);
```

## Shortcut

The [`stdio`](../readme.md#optionsstdio) option can also be a single value [`'pipe'`](#stdout-and-stderr), [`'overlapped'`](windows.md#asynchronous-io), [`'ignore'`](#ignore-output) or [`'inherit'`](#terminal-output). This is a shortcut for setting that same value with the [`stdin`](../readme.md#optionsstdin), [`stdout`](../readme.md#optionsstdout) and [`stderr`](../readme.md#optionsstderr) options.

```js
await execa({stdio: 'ignore'})`npm run build`;
// Same as:
await execa({stdin: 'ignore', stdout: 'ignore', stderr: 'ignore'})`npm run build`;
```

## Big output

To prevent high memory consumption, a maximum output size can be set using the [`maxBuffer`](../readme.md#optionsmaxbuffer) option. It defaults to 100MB.

When this threshold is hit, the subprocess fails and [`error.isMaxBuffer`](../readme.md#resultismaxbuffer) becomes `true`. The truncated output is still available using [`error.stdout`](../readme.md#resultstdout) and [`error.stderr`](../readme.md#resultstderr).

This is measured:
- By default: in [characters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length).
- If the [`encoding`](binary.md#encoding) option is `'buffer'`: in bytes.
- If the [`lines`](lines.md#simple-splitting) option is `true`: in lines.
- If a [transform in object mode](transform.md#object-mode) is used: in objects.

```js
try {
	await execa({maxBuffer: 1_000_000})`npm run build`;
} catch (error) {
	if (error.isMaxBuffer) {
		console.error('Error: output larger than 1MB.');
		console.error(error.stdout);
		console.error(error.stderr);
	}

	throw error;
}
```

## Low memory

When the [`buffer`](../readme.md#optionsbuffer) option is `false`, [`result.stdout`](../readme.md#resultstdout), [`result.stderr`](../readme.md#resultstderr), [`result.all`](../readme.md#resultall) and [`result.stdio[*]`](../readme.md#resultstdio) properties are not set.

This prevents high memory consumption when the output is big. However, the output must be either ignored, [redirected](#file-output) or [streamed](streams.md). If streamed, this should be done right away to avoid missing any data.

<hr>

[**Next**: 📃 Text lines](lines.md)\
[**Previous**: 🎹 Input](input.md)\
[**Top**: Table of contents](../readme.md#documentation)