// Follow the current UI through real clicks; older milestone contracts remain tested.
export async function control(page,selector){const locator=page.locator(selector);
 if(/^#script-(source|mode|compile)/.test(selector)&&await page.locator('#script-component').isHidden()){
  await page.locator('#component-choice').selectOption('Script');await page.locator('#component-add').click();
 }
 const ancestors=await locator.first().evaluate(node=>{const result=[];for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')result.unshift({id:p.id,open:p.open});return result;});
 for(const detail of ancestors)if(!detail.open)await page.locator('#'+detail.id+' > summary').click();
 return locator;
}
