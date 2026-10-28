
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { uia } from "uia-tree";

import {
  mouse,
  keyboard,
  straightTo,
  Button,
  Point,
  Key,
} from "@nut-tree-fork/nut-js";

const execFileAsync = promisify(execFile);

const TARGET_USERNAME = "ps_bhavesh_";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Bring Instagram to the foreground.
async function bringInstagramToForeground() {
  const script = `
    $ws = New-Object -ComObject WScript.Shell
    if (-not $ws.AppActivate("Instagram")) {
      Write-Error "Instagram window not found."
      exit 1
    }
  `;

  await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-Command",
    script,
  ]);

  await sleep(700);
}

// Read the current Instagram UI tree.
async function readInstagram() {
  const snapshot = await uia.readByTitle("Instagram");

  if (!snapshot) {
    throw new Error("Could not read Instagram UI.");
  }

  return snapshot;
}

// Click an element using its UI Automation coordinates.
async function clickElement(element) {
  if (
    !element?.click ||
    !element.enabled ||
    element.offscreen
  ) {
    throw new Error("Element is not clickable.");
  }

  await mouse.move(
    straightTo(
      new Point(element.click.x, element.click.y)
    )
  );

  await mouse.click(Button.LEFT);
}

// Search for the target username.
async function searchForUsername() {
  let snapshot = await readInstagram();

  let searchInput = (snapshot.elements ?? []).find(
    (el) =>
      el.role === "Edit" &&
      (el.name ?? "").trim().toLowerCase() === "search" &&
      el.enabled &&
      !el.offscreen &&
      el.click
  );

  if (!searchInput) {
    console.log(
      "Search input not found. Open Instagram's Search panel and try again."
    );
    return null;
  }

  await clickElement(searchInput);
  await sleep(300);

  // Select any existing search text.
  await keyboard.pressKey(Key.LeftControl);
  await keyboard.pressKey(Key.A);
  await keyboard.releaseKey(Key.A);
  await keyboard.releaseKey(Key.LeftControl);

  await keyboard.type(TARGET_USERNAME);
  await sleep(1500);

  snapshot = await readInstagram();

  const elements = snapshot.elements ?? [];

  console.log(`\nResults for "${TARGET_USERNAME}":`);

  const matches = elements.filter((el) => {
    const name = (el.name ?? "").toLowerCase();

    return (
      name.includes(TARGET_USERNAME.toLowerCase()) &&
      el.role === "Button"
    );
  });

  for (const el of matches) {
    console.log({
      id: el.id,
      role: el.role,
      name: el.name,
      click: el.click,
      parent: el.parent,
      enabled: el.enabled,
      offscreen: el.offscreen,
    });
  }

  return { snapshot, matches };
}

// Find the individual-looking conversation, not a group or
// the similarly named ps_bhavesh_purbia account.
function findConversation(matches) {
  return matches.find((el) => {
    const name = (el.name ?? "").toLowerCase();

    return (
      name.includes(TARGET_USERNAME.toLowerCase()) &&
      !name.includes("ps_bhavesh_purbia") &&
      !name.includes("chhayank") &&
      !name.includes("chktr1555")
    );
  });
}

// Open the candidate conversation and inspect the updated UI.
async function openConversation(conversation) {
  if (!conversation) {
    console.log(
      "\nNo suitable conversation found. No conversation was opened."
    );
    return;
  }

  console.log("\nOpening candidate conversation:");
  console.log(conversation.name);

  await clickElement(conversation);
  await sleep(1000);

  const snapshot = await readInstagram();
  const elements = snapshot.elements ?? [];

  console.log("\nPossible message controls:");

  const controls = elements.filter((el) => {
    const name = (el.name ?? "").toLowerCase();

    return (
      ["Edit", "Button", "Document"].includes(el.role) &&
      /message|send/i.test(name)
    );
  });

  for (const el of controls) {
    console.log({
      id: el.id,
      role: el.role,
      name: el.name,
      rect: el.rect,
      click: el.click,
      enabled: el.enabled,
      offscreen: el.offscreen,
    });
  }

  console.log(
    "\nVerify the conversation header before sending any message."
  );
}

async function main() {
  try {
    await bringInstagramToForeground();
    console.log("Instagram is in the foreground.");

    const result = await searchForUsername();

    if (!result) return;

    const conversation = findConversation(result.matches);

    if (!conversation) {
      console.log(
        "\nCould not identify an individual-looking conversation."
      );
      console.log(
        "Inspect the printed results before choosing an account."
      );
      return;
    }

    await openConversation(conversation);
  } catch (error) {
    console.error("Instagram automation failed:", error.message);
  }
}

main();
