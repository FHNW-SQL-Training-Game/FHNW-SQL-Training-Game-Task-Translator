const { Translate } = require("@google-cloud/translate").v2;
const path = require("path");
const fs = require("fs");

// Consts
const DESCRIPTION_REGEX = /(?<=DESCRIPTION {)[^}]*(?=})/;
const INPUT_ARG = 2;
const OUTPUT_ARG = 3;
const TOKEN_ARG = 4;

// ARGS
const inputPath = process.argv[INPUT_ARG];
const outputPath = process.argv[OUTPUT_ARG];
const tokenPath = process.argv[TOKEN_ARG];

// ARGS check
if (!inputPath || !outputPath || !tokenPath) {
  console.error("⚠️\t Missing args, see README.md!");
  return;
}

// Folders
const directoryInputPath = path.join(__dirname, inputPath);
const directoryOutputPath = path.join(__dirname, outputPath);

// Translate Client
process.env.GOOGLE_APPLICATION_CREDENTIALS = tokenPath;
const translate = new Translate();

// Ensure output dir exists
if (!fs.existsSync(directoryOutputPath)) fs.mkdirSync(directoryOutputPath);

// Read Input dir
fs.readdir(directoryInputPath, function (err, fileNames) {
  if (err) return console.log("Unable to scan directory: " + err);
  // Filter task files
  const taskFileNames = fileNames.filter((m) => m.endsWith(".task"));
  // Loop trough each filenames
  taskFileNames.forEach(function (fileName) {
    // readfile
    fs.readFile(path.join(directoryInputPath, fileName), "utf8", function (err, content) {
      var matches = content.match(DESCRIPTION_REGEX);
      if (matches) {
        const initialDescription = matches[0];
        translate
          .translate(initialDescription, "en")
          .then(([translatedDescription]) => {
            content = content.replace(DESCRIPTION_REGEX, translatedDescription);
            fs.writeFileSync(path.join(directoryOutputPath, fileName), content);
          })
          .catch((err) => {
            console.log(`Couldn't translate: ${fileName}`, err);
          });
      }
    });
  });
});
