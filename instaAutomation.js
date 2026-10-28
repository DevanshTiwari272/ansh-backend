
import {
  keyboard,
  Key,
  mouse,
  straightTo,
  Button,
  Point
} from '@nut-tree-fork/nut-js';

import main from './test.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function insta(info) {
  // Open Windows Search
  await keyboard.pressKey(Key.LeftWin);
  await keyboard.releaseKey(Key.LeftWin);
  await sleep(500);

  await keyboard.type('Instagram');
  await sleep(1000);

  await keyboard.pressKey(Key.Enter);
  await keyboard.releaseKey(Key.Enter);
  await sleep(5000);

  // Press F11 if you need fullscreen
  await keyboard.pressKey(Key.F11);
  await keyboard.releaseKey(Key.F11);
  await sleep(2000);

  // Click the first target location
  await mouse.move(straightTo(new Point(23, 261)));
  await mouse.click(Button.LEFT);
  await sleep(2000);

  // Click the second target location
  await mouse.move(straightTo(new Point(209 ,144)));
  await mouse.click(Button.LEFT);
  await sleep(2000);
  await keyboard.type(info.lookfor)
  await keyboard.type(Key.Enter)
   await sleep(2000)
  // Find the username on screen
  const position = await main(info.lookfor);

  if (!position) {
    console.log('Target not found; stopping.');
    return;
  }

  const { x, y } = position;
  console.log('Found target at:', x, y);

  await mouse.setPosition({ x, y });
  await mouse.click(Button.LEFT);
 await sleep(600)
await keyboard.type(info.message)
await keyboard.type(Key.Enter)
  console.log('Done');
}

insta({lookfor:'akshitaxubey',message:'it works bitch',}).catch(console.error);
