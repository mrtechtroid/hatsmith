const { writeFile, readFile } = require("fs").promises;
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

  const file = await readFile(join(__dirname, "out/404/index.html"));
  await writeFile(join(__dirname, "out/404.html"), file);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
