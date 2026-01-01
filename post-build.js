const { writeFile, readFile, access } = require("fs").promises;
const { constants } = require("fs");
const { join } = require("path");

const main = async () => {
  console.log("Node version:", process.version);
  console.log("NPM version:", (() => {
    try {
      return require("child_process").execSync("npm -v").toString().trim();
    } catch {
      return "unknown";
    }
  })());

  const sourceFile = join(__dirname, "out/404/index.html");
  const targetFile = join(__dirname, "out/404.html");
  
  try {
    // Check if the source file exists
    await access(sourceFile, constants.F_OK);
    
    // If it exists, copy it to the target location
    const file = await readFile(sourceFile);
    await writeFile(targetFile, file);
    console.log("Successfully copied 404/index.html to 404.html");
  } catch (error) {
    console.log("Static export not configured or 404/index.html not found, skipping 404.html generation");
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
