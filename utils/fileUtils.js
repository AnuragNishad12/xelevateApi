const fs = require("fs");
const path = require("path");

const readFile = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), "utf8"); // Create an empty file if not exists
      resolve([]);
    } else {
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) reject(err);
        resolve(JSON.parse(data));
      });
    }
  });
};

const writeFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8", (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};

module.exports = { readFile, writeFile };