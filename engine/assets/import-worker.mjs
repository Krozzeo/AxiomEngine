import {parentPort,workerData} from 'node:worker_threads';
import {decodeAsset} from './import.mjs';
import {advancedFormat,parseObj,parseStl,cleanMesh} from './advanced.mjs';
import {parseCad} from './cad.mjs';
try {const bytes=Buffer.from(workerData.bytes??workerData),settings=workerData.settings,format=advancedFormat(bytes);let asset=format==='step'||format==='iges'?await parseCad(bytes,format,settings):format==='obj'?parseObj(bytes,settings):format==='stl'?parseStl(bytes,settings):decodeAsset(bytes);if(settings&&asset.kind==='mesh'&&!format){if(asset.animation)throw Error('Mesh processing is for static geometry');asset=cleanMesh(asset.primitives,settings);}parentPort.postMessage({asset});}
catch(error){parentPort.postMessage({error:error.message,code:error.code??'AX_ASSET_0001'});}
