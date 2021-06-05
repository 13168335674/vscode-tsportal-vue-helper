/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:16
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:03:30
 */

const fs = require("fs-extra");
const path = require("path");
const vuese = require("@vuese/parser");
const _ = require("lodash");

const componenetsDirPath: string = path.resolve("path/components/dir");

async function getDirs(componenetsDirPath: string) {
  const res = await fs.readdir(componenetsDirPath);
  return res.filter((r: string) =>
    fs.statSync(path.resolve(componenetsDirPath, r)).isDirectory()
  );
}

function formatProps(props = []) {
  return props.map((item: any) => _.kebabCase(item.name));
}

async function main(componenetsDirPath: string, base = "index.vue") {
  const tags: any = {};
  try {
    const dirs = await getDirs(componenetsDirPath);
    const files = dirs.map((dir: string) => {
      return fs.readFile(path.resolve(componenetsDirPath, dir, base), "utf8");
    });
    const fscFiles = await Promise.all(files);
    fscFiles.map((file, index) => {
      const { props } = vuese.parser(file);
      const name = `global-${dirs[index]}`;
      tags[name] = {
        attributes: formatProps(props),
        description: "to trigger an operation",
      };
    });
  } catch (error) {
    console.log(`error`, error);
  }
  return tags;
}

main(componenetsDirPath).then((tags) => {
  fs.writeFileSync(
    path.resolve(__dirname, "__tags.js"),
    `export default ${JSON.stringify(tags)}`
  );
});
