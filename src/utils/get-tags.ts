/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:16
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:39:52
 */

import { window, workspace } from "vscode";

const path = require("path");

function getTags() {
  let TAGS;
  const config = workspace.getConfiguration("vscode-vue-components-helper");
  const tagsFilePath: string = config.get("tags-file-path");
  try {
    const _resPath = path.resolve(tagsFilePath);
    TAGS = require(_resPath);
  } catch (error) {
    const msg = `没有找到vscode配置文件(TAGS):${tagsFilePath}，将回退为插件默认配置文件`;
    window.showInformationMessage(msg);
    console.warn(msg);
    TAGS = require("../config/demo-tags.js");
  }
  return TAGS;
}
export default getTags;
