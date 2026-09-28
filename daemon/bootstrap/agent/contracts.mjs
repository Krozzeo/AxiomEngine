import catalog from '../../../protocol/tool-catalog.json' with {type:'json'};
export const tools=catalog.tools;
export const toolMap=new Map(tools.map(t=>[t.name,t]));
export const agentError=(code,message)=>Object.assign(new Error(message),{code});
export function validate(schema,value,path='arguments',depth=0) {
 const fail=()=>{throw agentError('AX_AGENT_0001',`Invalid ${path}`);};
 if(depth>24)fail();
 if(schema.const!==undefined&&value!==schema.const)fail();
 if(schema.enum&&!schema.enum.includes(value))fail();
 switch(schema.type){
 case 'object':
  if(!value||typeof value!=='object'||Array.isArray(value))fail();
  for(const key of schema.required??[])if(!Object.hasOwn(value,key))fail();
  for(const [key,child]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))fail();if(!Object.hasOwn(schema.properties??{},key)){if(schema.additionalProperties===false)fail();}else validate(schema.properties[key],child,`${path}.${key}`,depth+1);}break;
 case 'array':if(!Array.isArray(value)||value.length<(schema.minItems??0)||value.length>(schema.maxItems??4096))fail();for(const child of value)validate(schema.items??{},child,path+'[]',depth+1);break;
 case 'integer':if(!Number.isSafeInteger(value))fail(); // fall through
 case 'number':if(typeof value!=='number'||!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))fail();break;
 case 'string':if(typeof value!=='string'||value.length<(schema.minLength??0)||value.length>(schema.maxLength??12000000)||(schema.pattern&&!new RegExp(schema.pattern).test(value)))fail();break;
 case 'boolean':if(typeof value!=='boolean')fail();break;
 }
}
export const size=value=>Buffer.byteLength(JSON.stringify(value));
export function bounded(value,maxBytes=8192){if(size(value)>maxBytes)throw agentError('AX_AGENT_0003','Response exceeds context budget; narrow the query or increase maxBytes');return value;}
export function page(items,args={},extra={}){
 const offset=args.offset??0,limit=args.limit??25,maxBytes=args.maxBytes??8192;
 let selected=items.slice(offset,offset+limit);
 while(true){const nextOffset=offset+selected.length<items.length?offset+selected.length:null,result={...extra,items:selected,total:items.length,nextOffset};if(size(result)<=maxBytes){if(!selected.length&&offset<items.length)throw agentError('AX_AGENT_0003','One item exceeds context budget; increase maxBytes');return result;}if(!selected.length)return bounded(result,maxBytes);selected.pop();}
}
