#!/usr/bin/env node
import {sendMessage, getOneMessage} from '../../index.js';

const message = await getOneMessage();
const secondMessagePromise = getOneMessage();
await sendMessage(message);
await sendMessage(await secondMessagePromise);
