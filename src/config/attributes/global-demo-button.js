/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:25
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:21:03
 */
module.exports = {
  "global-demo-button/type": {
    options: [
      "primary",
      "others",
      "default",
      "black",
      "textGreen",
      "mainText",
      "warnText",
      "greyText",
      "blackWarn",
      "greyMain",
      "greyOther",
    ],
    defaultValue: "primary",
    optionType: "String",
    description: "to trigger an operation",
  },
  "global-demo-button/size": {
    options: ["medium", "small", "mini"],
    defaultValue: "medium",
    optionType: "String",
    description: "to trigger an operation",
  },
  "global-demo-button/disabled": {
    defaultValue: "false",
    optionType: "Boolean",
    description: "to trigger an operation",
  },
  "global-demo-button/loading": {
    defaultValue: "false",
    optionType: "Boolean",
    description: "to trigger an operation",
  },
  "global-demo-button/icon": {
    defaultValue: "",
    optionType: "String",
    description: "to trigger an operation",
  },
  "global-demo-button/icon-position": {
    options: ["left", "right"],
    defaultValue: "left",
    optionType: "String",
    description: "to trigger an operation",
  },
};
