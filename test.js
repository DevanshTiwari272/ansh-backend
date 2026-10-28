
import screenshot from "screenshot-desktop";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { screen } from "@nut-tree-fork/nut-js";

const normalize = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]/g, "");

export default async function main(target = "ps_bhavesh_purbia") {
  const worker = await createWorker("eng");

  try {
    const image = await screenshot({ format: "png" });
    const metadata = await sharp(image).metadata();

    const scaleX = (await screen.width()) / metadata.width;
    const scaleY = (await screen.height()) / metadata.height;

    const result = await worker.recognize(
      image,
      {},
      { text: true, tsv: true }
    );

    const words = result.data.tsv
      .trim()
      .split(/\r?\n/)
      .slice(1)
      .flatMap((row) => {
        const c = row.split("\t");

        if (c.length < 12 || Number(c[0]) !== 5) return [];

        const text = c.slice(11).join("\t").trim();
        if (!text) return [];

        return [{
          text,
          normalized: normalize(text),
          x: Number(c[6]) * scaleX,
          y: Number(c[7]) * scaleY,
          width: Number(c[8]) * scaleX,
          height: Number(c[9]) * scaleY,
          confidence: Number(c[10]),
        }];
      });

    // Find "More" and "accounts" as separate OCR words.
    const more = words.filter((w) => w.normalized === "more");
    const accounts = words.filter((w) => w.normalized === "accounts");

    let cutoffY = null;

    for (const m of more) {
      const match = accounts.find((a) => {
        const verticalDifference = Math.abs(a.y - m.y);
        const horizontalGap = a.x - (m.x + m.width);

        return (
          verticalDifference < Math.max(m.height, a.height) &&
          horizontalGap >= -5 &&
          horizontalGap < 180
        );
      });

      if (match) {
        cutoffY = Math.max(
          m.y + m.height,
          match.y + match.height
        );
        break;
      }
    }

    if (cutoffY === null) {
      console.log("Could not locate the More accounts option.");
      console.log("OCR words:", words.map((w) => w.text));
      return null;
    }

    const targetNorm = normalize(target);

    // Restrict the search to the left-side account-list region,
    // below "More accounts", rather than the open conversation.
    const candidates = words.filter((w) => {
      if (w.y <= cutoffY) return false;

      // Adjust this boundary if your account list is wider/narrower.
      if (w.x > metadata.width * scaleX * 0.42) return false;

      const found = w.normalized;

      return (
        found === targetNorm ||
        (
          found.length >= 8 &&
          targetNorm.length >= 8 &&
          (targetNorm.includes(found) || found.includes(targetNorm))
        )
      );
    });

    // Prefer the first matching result vertically.
    candidates.sort((a, b) => a.y - b.y);

    if (!candidates.length) {
      console.log(`No matching username below More accounts: ${target}`);
      console.log("Check whether OCR recognized the full username.");
      return null;
    }

    const selected = candidates[0];

    const point = {
      x: Math.round(selected.x + selected.width / 2),
      y: Math.round(selected.y + selected.height / 2),
    };

    console.log("Target:", target);
    console.log("Selected OCR text:", selected.text);
    console.log("Click point:", point);

    return point;
  } finally {
    await worker.terminate();
  }
}
