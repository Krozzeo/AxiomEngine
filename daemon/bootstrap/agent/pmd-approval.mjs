import {workError} from './work-orders.mjs';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const approval=/\b(?:aprueb\w*|aprob\w*|acept\w*|approve\w*|accept\w*|confirm\w*|autoriz\w*|de acuerdo|esta bien|perfecto|dale|sigamos|continu\w*|adelante|pasemos|avanc\w*)\b/;
const construction=/\b(?:construccion|contruccion|construction|constru\w*|genera\w*|crea\w*|hacer el pmd|hacer el documento|comenz\w*|comenc\w*|empeza\w*)\b/;
const navigation=/\b(?:pasemos|pasar|pasa|avanc\w*|continu\w*|comenz\w*|comenc\w*|empez\w*|construye|construyamos|genera\w*|crea\w*|hacer el pmd|hacer el documento)\b/;
const skip=/\b(?:omit\w*|salt\w*|skip|sin analisis|sin critica|no quiero|no me interesa|no gracias)\b/;
const short=/^(?:si|yes|ok|okey|perfecto|dale|de acuerdo|adelante|continua|sigamos)[\s,.!]*(?:(?:sigamos|continua|adelante|pasemos)[.! ]*)?$/;
function humanPhrase(userQuote,userText){
 if(!userText.includes(userQuote))throw workError('Approval must quote the current human chat message, not a file or earlier turn');
 const text=normalize(userText),quote=normalize(userQuote),at=text.indexOf(quote),before=text.slice(0,at),boundary=c=>c===undefined||/[^a-z0-9]/.test(c);
 if(at<0||!boundary(text[at-1])||!boundary(text[at+quote.length]))throw workError('Approval quote must be a complete phrase, not a word fragment');
 if(/(?:dice|says|frase|phrase|quoted|quote|texto|text)\s*[:="'“«]*\s*$/.test(before)||/\b(?:el texto dice|the file says|el archivo dice)\b/.test(text))throw workError('Quoted/reference text is not a human phase instruction');
 if(/\b(?:unless|excepto|siempre que|provided that)\b/.test(text)||/\b(?:aprueb\w*|aprob\w*|acept\w*|approv\w*)\s+si\b/.test(text))throw workError('Conditional approval needs one clarification');
 if(/\b(?:no|not|dont|do not)\s+(?:aprueb\w*|aprob\w*|acept\w*|approv\w*|accept\w*|autoriz\w*|confirm\w*)\b/.test(text)||/\b(?:rechazo|reject)\b/.test(text))throw workError('Approval is negative; clarify the user intent once');
 return {text,quote};
}
export function authorizePmdTransition({action,userQuote,revision},pmd,userText){
 if(!pmd||pmd.revision!==revision)throw workError('PMD revision changed; use the current document revision');
 const {quote}=humanPhrase(userQuote,userText);
 const valid={definition:['approve-definition'],planning:['approve-plan'],critique:['request-critique','skip-critique','finish-critique'],construction:['finish'],ready:['revisit']};
 if(!valid[pmd.phase]?.includes(action))throw workError('Transition is unavailable in '+pmd.phase+'; allowed: '+(valid[pmd.phase]??[]).join(', '));
 const patterns={
  'approve-definition':approval,'approve-plan':approval,
  'request-critique':/\b(?:si|yes|analisis|critica|critico|critique|critical|analiza|analyze)\b/,
  'skip-critique':skip,'finish-critique':approval,
  'finish':/\b(?:termin\w*|finaliz\w*|finish\w*|complete\w*|listo|constru\w*|crea\w*|genera\w*|build|generate)\b/,
  'revisit':/\b(?:redefin\w*|revisit\w*|reabr\w*|reopen\w*|redisen\w*|redesign\w*|volver|reiniciar)\b/
 };
 const contextual=short.test(quote)&&/aproba|aprueb|approve|definicion|definition|planifica|milestone|plan|analisis|analysis|critica|critique/i.test(pmd.chat?.filter(c=>c.role==='assistant').at(-1)?.text??'');
 const directConstruction=pmd.phase==='critique'&&construction.test(quote)&&navigation.test(quote)&&!/[?¿]/.test(quote);
 if(!patterns[action]?.test(quote)&&!contextual&&!(['skip-critique','finish-critique'].includes(action)&&directConstruction))throw workError('No clear approval/instruction in the quoted human text; ask one clarification');
 if(short.test(quote)&&!contextual)throw workError('Short approval has no phase proposal to refer to; clarify once');
 if(action==='request-critique'&&skip.test(quote))throw workError('The user requested skipping critique, not starting it');
 return {action,userQuote,revision};
}
// Human navigation is host-owned. It does not depend on another model call choosing a magic action.
export function resolvePmdActions(pmd,userText){
 if(!pmd)return [];const text=normalize(userText),actions=[];if(/^(?:que\b|como\b|por que\b|explica\w*\b|no entiendo\b|why\b|how\b|what\b)/.test(text.trim()))return [];
 const offered=/aproba|aprueb|approve|definicion|definition|planifica|milestone|plan|critica|critique/i.test(pmd.chat?.filter(c=>c.role==='assistant').at(-1)?.text??'');
 const explicit=approval.test(text)&&(/definicion|definition|plan|recomendacion|cambios|critica|critique|sigamos|adelante/.test(text)||short.test(text));
 const directConstruction=construction.test(text)&&navigation.test(text)&&!/[?¿]/.test(text);
 if(pmd.phase==='definition'&&(explicit||short.test(text)&&offered))actions.push('approve-definition');
 if(pmd.phase==='planning'&&pmd.roadmap?.length&&(explicit||short.test(text)&&offered)){actions.push('approve-plan');if(skip.test(text)||directConstruction)actions.push('skip-critique');}
 if(pmd.phase==='critique'){
  if(skip.test(text)||directConstruction)actions.push('skip-critique');
  else if(explicit)actions.push('finish-critique');
 }
 // Revalidate the exact current human text, never file contents or archived approvals.
 try{let next={...pmd};for(const action of actions){authorizePmdTransition({action,userQuote:userText,revision:next.revision},next,userText);next={...next,phase:action==='approve-definition'?'planning':action==='approve-plan'?'critique':'construction',revision:next.revision+1};}}catch{return [];}
 return actions;
}
