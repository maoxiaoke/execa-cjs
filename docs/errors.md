<picture>
	<source media="(prefers-color-scheme: dark)" srcset="../media/logo_dark.svg">
	<img alt="execa logo" src="../media/logo.svg" width="400">
</picture>
<br>

# ❌ Errors

## Subprocess failure

When the subprocess fails, the promise returned by [`execa()`](../readme.md#execafile-arguments-options) is rejected with an [`ExecaError`](../readme.md#execaerror) instance. The `error` has the same shape as successful [results](../readme.md#result), with a few additional [error-specific fields](../readme.md#execaerror). [`error.failed`](../readme.md#resultfailed) is always `true`.

```js
import {execa, ExecaError} from 'execa';

try {
	const result = await execa`npm run build`;
	console.log(result.failed); // false
} catch (error) {
	if (error instanceof ExecaError) {
		console.error(error.failed); // true
	}
}
```

## Preventing exceptions

When the [`reject`](../readme.md#optionsreject) option is `false`, the `error` is returned instead.

```js
const resultOrError = await execa`npm run build`;
if (resultOrError.failed) {
	console.error(resultOrError);
}
```

## Exit code

The subprocess fails when its [exit code](https://en.wikipedia.org/wiki/Exit_status) is not `0`. The exit code is available as [`error.exitCode`](../readme.md#resultexitcode). It is `undefined` when the subprocess fails to spawn or when it was [terminated by a signal](termination.md#signal-termination).

```js
try {
	await execa`npm run build`;
} catch (error) {
	// Either non-0 integer or undefined
	console.error(error.exitCode);
}
```

## Failure reason

The subprocess can fail for other reasons. Some of them can be detected using a specific boolean property:
- [`error.timedOut`](../readme.md#resulttimedout): [`timeout`](termination.md#timeout) option.
- [`error.isCanceled`](../readme.md#resultiscanceled): [`cancelSignal`](termination.md#canceling) option.
- [`error.isMaxBuffer`](../readme.md#resultismaxbuffer): [`maxBuffer`](output.md#big-output) option.
- [`error.isTerminated`](../readme.md#resultisterminated): [signal termination](termination.md#signal-termination). This includes the [`timeout`](termination.md#timeout) and [`cancelSignal`](termination.md#canceling) options since those terminate the subprocess with a [signal](termination.md#default-signal). However, this does not include the [`maxBuffer`](output.md#big-output) option.

Otherwise, the subprocess failed because either:
- An exception was thrown in a [stream](streams.md) or [transform](transform.md).
- The command's executable file was not found.
- An invalid [option](../readme.md#options) was passed.
- There was not enough memory or too many subprocesses.

```js
try {
	await execa`npm run build`;
} catch (error) {
	if (error.timedOut) {
		handleTimeout(error);
	}

	throw error;
}
```

## Error message

For better [debugging](debugging.md), [`error.message`](../readme.md#errormessage) includes both:
- The command and the [reason it failed](#failure-reason).
- Its [`stdout`, `stderr`](output.md#stdout-and-stderr) and [other file descriptors'](output.md#additional-file-descriptors) output, separated with newlines and not [interleaved](output.md#interleaved-output).

[`error.shortMessage`](../readme.md#errorshortmessage) is the same but without `stdout`/`stderr`.

[`error.originalMessage`](../readme.md#errororiginalmessage) is the same but also without the command. This exists only in specific instances, such as when calling [`subprocess.kill(error)`](termination.md#error-message-and-stack-trace), using the [`cancelSignal`](termination.md#canceling) option, passing an invalid command or [option](../readme.md#options), or throwing an exception in a [stream](streams.md) or [transform](transform.md).

```js
try {
	await execa`npm run build`;
} catch (error) {
	console.error(error.originalMessage);
	// The task "build" does not exist.

	console.error(error.shortMessage);
	// Command failed with exit code 3: npm run build
	// The task "build" does not exist.

	console.error(error.message);
	// Command failed with exit code 3: npm run build
	// The task "build" does not exist.
	// [stderr contents...]
	// [stdout contents...]
}
```

## Retry on error

Safely handle failures by using automatic retries and exponential backoff with the [`p-retry`](https://github.com/sindresorhus/p-retry) package.

```js
import pRetry from 'p-retry';
import {execa} from 'execa';

const run = () => execa`curl -sSL https://sindresorhus.com/unicorn`;
console.log(await pRetry(run, {retries: 5}));
```

<hr>

[**Next**: 🏁 Termination](termination.md)\
[**Previous**: 🌐 Environment](environment.md)\
[**Top**: Table of contents](../readme.md#documentation)