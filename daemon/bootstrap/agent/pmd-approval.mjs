import {workError} from './work-orders.mjs';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function authorizePmdTransition({action,userQuote,revision},pmd,userText){
 if(!pmd||pmd.revision!==revision)throw workError('PMD revision changed; read the current phase before advancing');
 if(!userText.includes(userQuote))throw workError('Approval must quote the current human chat message, not a file or earlier turn');
 const text=normalize(userText),quote=normalize(userQuote),at=text.indexOf(quote),before=text.slice(0,at);
 const boundary=c=>c===undefined||/[^a-z0-9]/.test(c);if(at<0||!boundary(text[at-1])||!boundary(text[at+quote.length]))throw workError('Approval quote must be a complete phrase, not a word fragment');
 if(/(?:dice|says|frase|phrase|quoted|quote|texto|text)\s*[:="'“«]*\s*$/.test(before)||action!=='skip-critique'&&/\b(?:no|not|dont|rechazo|reject|excepto|unless)\b/.test(before))throw workError('Quoted/reference or negated text is not a clear human phase instruction');
 if(/\b(?:unless|excepto|siempre que|provided that)\b/.test(text))throw workError('Conditional approval needs one clarification');
 if(action!=='skip-critique'&&/\b(?:no|not|dont|rechazo|reject|excepto|unless)\b/.test(quote)||/\b(?:no aprueb|no acept|do not approv|dont approv)\b/.test(text))throw workError('Approval is negative or conditional; clarify the user intent once');
 const valid={definition:['approve-definition'],planning:['approve-plan'],critique:['request-critique','skip-critique','finish-critique'],construction:['finish'],ready:['revisit']};if(!valid[pmd.phase]?.includes(action))throw workError('Transition is unavailable in the current PMD phase');
 const patterns={
 'approve-definition':/\b(?:aprueb\w*|aprob\w*|acept\w*|approve\w*|accept\w*|de acuerdo|esta bien|pasemos|continua|adelante|si|yes|ok(?:ey)?)\b/,
 'approve-plan':/\b(?:aprueb\w*|aprob\w*|acept\w*|approve\w*|accept\w*|de acuerdo|esta bien|pasemos|continua|adelante|si|yes|ok(?:ey)?)\b/,
 'request-critique':/\b(?:si|yes|analisis|critica|critico|critique|critical|analiza|analyze)\b/,
 'skip-critique':/\b(?:omite|omitamos|omitir|salta|saltar|skip|sin analisis|sin critica|no quiero|no me interesa|no gracias)\b/,
 'finish-critique':/\b(?:termin|finaliz|finish|complete|listo|suficiente|adelante|continua|acept|aprueb)\w*/,
 'finish':/\b(?:termin|finaliz|finish|complete|listo|construye|crea|genera|build|generate)\w*/,
 'revisit':/\b(?:redefin|revisit|reabr|reopen|redisen|redesign|volver|reiniciar)\w*/
 };if(!patterns[action].test(quote))throw workError('No clear approval/instruction in the quoted human text; ask one clarification');
 // A short yes is meaningful only in a conversation about this phase.
 if(/^(si|yes|ok|okey|adelante|continua)[.! ]*$/.test(quote)&&!pmd.chat?.filter(c=>c.role==='assistant').at(-1)?.text.match(/aproba|aprueb|approve|definicion|definition|planifica|milestone|plan|analisis|analysis|critica|critique/i))throw workError('Short approval has no phase proposal to refer to; clarify once');
 return {action,userQuote,revision};
}
