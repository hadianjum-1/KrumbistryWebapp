// Upload local images to Cloudinary
// Run: npx tsx scripts/upload-images.ts

import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const publicDir = path.join(process.cwd(), "public");

const uploads = [
  // Instagram gallery images
  { file: "instagram/Bakery Flatlay.jpg",              folder: "krumbistry/instagram", public_id: "instagram-01-bakery-flatlay" },
  { file: "instagram/Flaky Croissant Honeycomb.jpg",   folder: "krumbistry/instagram", public_id: "instagram-02-croissant-honeycomb" },
  { file: "instagram/Luxury Packaging Box.jpg",        folder: "krumbistry/instagram", public_id: "instagram-03-luxury-packaging" },
  { file: "instagram/Molten Lava Cake Cut.jpg",        folder: "krumbistry/instagram", public_id: "instagram-04-molten-lava-cake" },
  { file: "instagram/Pistachio Raspberry Tartlet.jpg", folder: "krumbistry/instagram", public_id: "instagram-05-pistachio-tartlet" },
  // About page images
  { file: "about-images/about-kitchen.jpg",       folder: "krumbistry/about", public_id: "about-kitchen" },
  { file: "about-images/atelier-buttercream.jpg", folder: "krumbistry/about", public_id: "atelier-buttercream" },
  { file: "about-images/atelier-cake.jpg",        folder: "krumbistry/about", public_id: "atelier-cake" },
  { file: "about-images/atelier-croissants.jpg",  folder: "krumbistry/about", public_id: "atelier-croissants" },
];

async function run() {
  const results: Record<string, string> = {};

  for (const item of uploads) {
    const filePath = path.join(publicDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      continue;
    }
    console.log(`⬆️  Uploading ${item.file} ...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: item.folder,
        public_id: item.public_id,
        overwrite: true,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
      results[item.public_id] = result.secure_url;
      console.log(`✅ ${item.public_id}: ${result.secure_url}`);
    } catch (err) {
      console.error(`❌ Failed ${item.file}:`, err);
    }
  }

  console.log("\n=== RESULTS ===");
  console.log(JSON.stringify(results, null, 2));
}

run();

