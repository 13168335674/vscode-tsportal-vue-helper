/*
 * @Author       : ADI
 * @Date         : 2021-06-05 10:00:25
 * @LastEditors  : ADI
 * @LastEditTime : 2021-06-05 10:18:05
 */
module.exports = {
  "global-demo-button": {
    defaults: ["type", "size"],
    attributes: [
      "type",
      "size",
      "disabled",
      "loading",
      "icon",
      "icon-position",
    ],
    description: "to trigger an operation",
  },
  "global-demo-dialog": {
    defaults: ["dialog-title", "dialog-size", "dialog-visible"],
    attributes: [
      "dialog-visible",
      "dialog-title",
      "dialog-size",
      "dialog-width",
      "lock-dialog-body-height",
      "with-title",
      "with-footer",
      "with-cancel-btn",
      "with-reset-btn",
      "sure-btn-name",
      "cancel-btn-name",
      "reset-btn-name",
      "sure-btn-disabled",
      "sure-btn-loading",
      "centered",
      "closable",
      "mask-closable",
      "keyboard",
      "z-index",
      "wrap-class-name",
    ],
    description: "to trigger an operation",
  },
};
