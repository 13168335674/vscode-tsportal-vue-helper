/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:16
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:38:01
 */

import { window, workspace } from "vscode";

const path = require("path");

function getAttrs() {
  let ATTRS;
  const config = workspace.getConfiguration("tsportal-helper");
  const attrsFilePath: string = config.get("attrs-file-path");
  try {
    const _resPath = path.resolve(attrsFilePath);
    ATTRS = require(_resPath);
  } catch (error) {
    const msg = `没有找到vscode配置文件(ATTRS):${attrsFilePath}，将回退为插件默认配置文件`;
    window.showInformationMessage(msg);
    console.warn(msg);
    ATTRS = require("../config/demo-attrs.js");
  }
  return ATTRS;
}
export default getAttrs;
