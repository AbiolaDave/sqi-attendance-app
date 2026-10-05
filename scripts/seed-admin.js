const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

function loadLocalEnv() {
  if (!fs.existsSync(".env")) return;

  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

async function seedAdmin() {
  loadLocalEnv();

  if (!process.env.URI) {
    throw new Error("The URI environment variable is not configured.");
  }

  const connection = await mongoose.connect(process.env.URI, {
    bufferCommands: false,
  });
  const admins = connection.connection.collection("admins");
  const passwordHash = await bcrypt.hash("admin123", 12);
  const now = new Date();

  await admins.updateOne(
    { email: "admin@sqi.edu.ng" },
    {
      $set: {
        name: "Adaeze Obi (Admin)",
        phone: "+2348000000000",
        role: "super_admin",
        isActive: true,
        updatedAt: now,
      },
      $setOnInsert: {
        email: "admin@sqi.edu.ng",
        passwordHash,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log("Admin ready: admin@sqi.edu.ng");
}

seedAdmin()
  .catch((error) => {
    console.error("Admin seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
