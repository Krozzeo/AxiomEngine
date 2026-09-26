import { parentPort, workerData } from 'node:worker_threads';
import { decodeAsset } from './import.mjs';
try {parentPort.postMessage({asset:decodeAsset(Buffer.from(workerData))});}
catch(error) {parentPort.postMessage({error:error.message,code:error.code??'AX_ASSET_0001'});}
