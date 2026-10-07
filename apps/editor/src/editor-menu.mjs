// Delegation also covers AI/Config sections inserted after editor initialization.
export function mountEditorMenu(document){
 if(!document.defaultView)return;
 function closeBranches(root){for(const d of root.querySelectorAll('details'))d.open=false;}
 document.addEventListener('click',event=>{const summary=event.target.closest?.('summary'),detail=summary?.parentElement;if(!detail||detail.tagName!=='DETAILS'||!summary.closest('.menubar,.editor-context'))return;for(const sibling of detail.parentElement.children)if(sibling!==detail&&sibling.tagName==='DETAILS'){sibling.open=false;closeBranches(sibling);}},{capture:true});
 document.addEventListener('toggle',event=>{const detail=event.target;if(detail.tagName!=='DETAILS'||!detail.closest?.('.menubar,.editor-context'))return;if(!detail.open){closeBranches(detail);return;}const popup=detail.querySelector(':scope > .submenu');if(!popup)return;popup.style.left='100%';popup.style.right='auto';if(popup.getBoundingClientRect().right>detail.ownerDocument.defaultView.innerWidth){popup.style.left='auto';popup.style.right='100%';}},{capture:true});
}
