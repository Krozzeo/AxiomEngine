// Follow the current UI through real clicks; older milestone contracts remain tested.
export async function control(page,selector){const locator=page.locator(selector);
 if(!/-cancel/.test(selector))await page.waitForFunction(()=>document.querySelector("#editor-workspace").getAttribute("aria-busy")==="false");
 if(/^#script-(source|mode|compile)/.test(selector)&&await page.locator('#script-component').isHidden()){
  await page.locator('#component-choice').selectOption('Script');await page.locator('#component-add').click();
 }
 if(await locator.first().evaluate(n=>!n.closest('.menubar'))){for(const id of ['file-menu','create-menu','panels-menu','settings-menu','ai-menu','help-menu'])if(await page.locator('#'+id).evaluate(n=>n.open))await page.locator('#'+id+' > summary').click();}
 const ancestors=await locator.first().evaluate(node=>{const result=[];for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')result.unshift({id:p.id,open:p.open});return result;});
 for(const detail of ancestors)if(!detail.open)await page.locator('#'+detail.id+' > summary').click();
 return locator;
}
