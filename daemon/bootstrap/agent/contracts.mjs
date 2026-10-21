import catalog from '../../../protocol/tool-catalog.json' with {type:'json'};
import {ToolRegistry} from 'axiom-platform/tools';
export {agentError,validate,size,bounded,page} from 'axiom-platform/tools';
export const registry=new ToolRegistry(catalog.tools);
export const tools=registry.tools;
export const toolMap=registry.map;
