import { mouse
 } from "@nut-tree-fork/nut-js";
 async function mouses() {
   const po= await mouse.getPosition()
   console.log(po.x,po.y)
 }
 mouses()