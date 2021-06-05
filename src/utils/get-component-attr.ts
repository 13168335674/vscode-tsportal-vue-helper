/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:16
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:47:45
 */
const fs = require("fs-extra");
const path = require("path");
const vuese = require("@vuese/parser");
const _ = require("lodash");

const componenetsDirPath = path.resolve("path/components/dir");

async function getDirs(componenetsDirPath) {
  const res = await fs.readdir(componenetsDirPath);
  return res.filter((r) =>
    fs.statSync(path.resolve(componenetsDirPath, r)).isDirectory()
  );
}

function formatProps(props = []) {
  return props.map((item) => item.name);
}

async function main(componenetsDirPath, base = "index.vue") {
  let dirs;
  try {
    dirs = await getDirs(componenetsDirPath);
    const files = dirs.map((dir) => {
      return fs.readFile(path.resolve(componenetsDirPath, dir, base), "utf8");
    });
    const fscFiles = await Promise.all(files);
    fscFiles.map((file, index) => {
      const { props } = vuese.parser(file);
      const name = `global-${dirs[index]}`;
      const data = formatProps(props).reduce((pre, type, idx) => {
        const porpData = props[idx] || {};
        pre[`${name}/${_.kebabCase(type)}`] = {
          defaultValue: porpData.default || "",
          optionType: porpData.type || "",
          description: "to trigger an operation",
        };
        return pre;
      }, Object.create(null));
      writeAttrFile(name, data);
    });
  } catch (error) {
    console.log(`error`, error);
  }
  return dirs;
}

main(componenetsDirPath).then((dirs) => {
  createMap({
    dirs,
    dirBase: "./attributes/",
    // targetDirPath: path.resolve(__dirname, "../config/attributes/index.js"),
    targetDirPath: path.resolve(__dirname, "__attrs.js"),
  });
});

function writeAttrFile(
  fileName,
  data,
  dirPath = path.resolve(__dirname, "../config/attributes")
) {
  data = `module.exports = ${JSON.stringify(data)}`;
  fs.writeFile(path.resolve(dirPath, `${fileName}.js`), data);
}

function createMap(config) {
  const mate = [];
  const res = [];
  config.dirs.forEach((dir) => {
    const _name = _.camelCase(dir);
    mate.push(`const ${_name} = ('${config.dirBase}global-${dir}');`);
    res.push(`...${_name}`);
  });
  const data = `
${mate.join("\n")}

module.exports = {
  ${res.join(",\n  ")}
};
  `;
  fs.writeFile(config.targetDirPath, data).then(() => {
    console.log(`文件生成成功! (${config.targetDirPath})`);
  });
}
export {};
