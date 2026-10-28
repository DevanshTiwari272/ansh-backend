import { execFile } from "node:child_process";
import { promisify } from "node:util";
import  {openApp, apps} from 'open';
import {
  mouse,
  keyboard,
  straightTo,
  Button,
  Point,
  Key,
} from "@nut-tree-fork/nut-js";

import { uia } from "uia-tree";

const execFileAsync = promisify(execFile);
function sleep(long) {
return new Promise((resolve)=>{setTimeout(()=>{resolve()},long)})
}
async function bringInstagramToForeground() {
  
  
  const script = `
    $ws = New-Object -ComObject WScript.Shell
    if (-not $ws.AppActivate("Instagram")) {
      Write-Error "Instagram window not found."
      exit 1
    }

  `;
try{
  await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-Command",
    script,
  ]);
  
}
catch(e){
   await keyboard.pressKey(Key.LeftWin);
  await keyboard.releaseKey(Key.LeftWin);
  await sleep(500);

  await keyboard.type('Instagram');
  await sleep(1000);

  await keyboard.pressKey(Key.Enter);
  await keyboard.releaseKey(Key.Enter);
  await sleep(7000);
  
}

  await sleep(700);
}
async function readinsta(params) {
  
  
    const snapShot=await uia.readByTitle('Instagram')
    return snapShot}

async function look(){

    const snap =await readinsta()
    
  const found = snap.elements.some(element => {
        
        return element?.name.toLowerCase().includes('messages')&&element?.role.toLowerCase().includes('hyperlink')
  });
  if(found){return snap}
  return look()

}
async function go(){

   await bringInstagramToForeground()
  const a=await look()
 
 const show= a.elements.filter(element => {return element?.rect?.x<300&&element?.rect?.y>200&&element?.rect?.y<400

  
    
  })
  a.elements.forEach(element => {
    if(element.id<100) {console.log(element)}})
 // console.log(show)
  const foundElement = a.elements.find((e)=>{if (e.name.toLowerCase().includes('messages')&&e.role.toLocaleLowerCase().includes('hyperlink')){return true}})
    mouse.setPosition({ x: foundElement.click.x , y: foundElement.click.y  });
}
go()
async function debugUI() {
  const snap = await readinsta();

  console.log("Total elements:", snap.elements.length);

  // Print every element located in the left sidebar area.
  const sidebar = snap.elements.filter(e => {
    const r = e?.rect;
    return r && r.x < 300 && r.y > 200 && r.y < 400;
  });

  console.table(sidebar.map(e => ({
    id: e.id,
    role: e.role,
    name: e.name,
    x: e.rect?.x,
    y: e.rect?.y,
    width: e.rect?.width,
    height: e.rect?.height,
    clickX: e.click?.x,
    clickY: e.click?.y
  })));
}

//debugUI().catch(console.error);