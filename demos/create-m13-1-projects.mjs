import {resolve} from 'node:path';
import {createM13Demos} from './create-m13-projects.mjs';
console.log('Creating M13.1 editable workspace/profiler demos; existing projects are preserved.');
console.log(JSON.stringify(await createM13Demos(resolve('.axiom/projects'),{label:'M13.1',compile:true,onProgress:console.log}),null,2));
console.log('See demos/M13_1_GUIDE.md. Drag individual tabs to the five dock sections.');
