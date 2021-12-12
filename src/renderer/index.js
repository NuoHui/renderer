const Reconciler = require("react-reconciler");

const hostConfig = {
  getRootHostContext: function (nextRootInstance) {
    console.log("getRootHostContext", nextRootInstance);
    let rootContext = {
      from: "from rootContext",
    };
    return rootContext;
  },
  getChildHostContext: function (
    parentHostContext,
    type,
    rootContainerInstance
  ) {
    console.log(
      "getChildHostContext",
      parentHostContext,
      type,
      rootContainerInstance
    );
    let context = {
      from: "from getChildHostContext",
    };
    return context;
  },
  shouldSetTextContent: function (type, props) {
    console.log("shouldSetTextContent", type, props);
    return false;
  },
  prepareForCommit: function (containerInfo) {
    console.log("prepareForCommit", containerInfo);
  },
  resetAfterCommit: function (containerInfo) {
    console.log("resetAfterCommit", containerInfo);
  },
  commitMount: (domElement, type, newProps, fiberNode) => {
    domElement.focus();
    console.log("commitMount", domElement, type, newProps, fiberNode);
  },
  createTextInstance: function (
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    console.log(
      "createTextInstance",
      text,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    );
    return document.createTextNode(text);
  },
  createInstance: function (
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    console.log(
      "createInstance",
      type,
      props,
      rootContainerInstance,
      hostContext,
      internalInstanceHandle
    );
    const element = document.createElement(type);
    element.className = props.className || "";
    element.style = props.style;
    // ....
    // ....
    if (props.onClick) {
      element.addEventListener("click", props.onClick);
    }
    return element;
  },
  supportsMutation: function (...args) {
    console.log("createInstance", ...args);
    return true;
  },
  appendInitialChild: function (parentInstance, child) {
    console.log("appendInitialChild", parentInstance, child);
    parentInstance.appendChild(child);
  },
  clearContainer: function (...args) {
    console.log("clearContainer", ...args);
  },
  appendChild: function (parentInstance, child) {
    parentInstance.appendChild(child);
    console.log("appendChild", parentInstance, child);
  },
  insertBefore: (parentInstance, child, beforeChild) => {
    parentInstance.insertBefore(child, beforeChild);
    console.log("insertBefore", parentInstance, child, beforeChild);
  },
  insertInContainerBefore: function(container, child, beforeChild) {
    container.insertBefore(child, beforeChild);
    console.log("insertInContainerBefore", container, child, beforeChild);
  },
  removeChildFromContainer: function(container, child) {
    container.removeChild(child);
    console.log("removeChildFromContainer", container, child);
  },
  resetTextContent: function(domElement) {
    console.log("resetTextContent", domElement);
  },
  shouldDeprioritizeSubtree: function(type, nextProps) {
    console.log("shouldDeprioritizeSubtree", type, nextProps);
    return !!nextProps.hidden
  },
  removeChild: function (parentInstance, child) {
    parentInstance.removeChild(child);
    console.log("removeChild", parentInstance, child);
  },
  finalizeInitialChildren: function (
    domElement,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    console.log(
      "finalizeInitialChildren",
      domElement,
      type,
      props,
      rootContainerInstance,
      hostContext
    );
    return props.autofocus; //simply return true for experimenting
  },
  appendChildToContainer: function (container, child) {
    console.log("appendChildToContainer", container, child);
    container.appendChild(child);
  },
  prepareUpdate: function (
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext
  ) {
    console.log(
      "prepareUpdate",
      domElement,
      type,
      oldProps,
      newProps,
      rootContainerInstance,
      hostContext
    );
    return;
  },
  commitUpdate: function (
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    finishedWork
  ) {
    console.log(
      "commitUpdate",
      instance,
      updatePayload,
      type,
      oldProps,
      newProps,
      finishedWork
    );
    return; //return nothing.
  },
  commitTextUpdate: function (textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
    console.log("commitTextUpdate", textInstance, oldText, newText);
  },
};
const reconcilerInstance = Reconciler(hostConfig);
const CustomRenderer = {
  render(element, renderDom, callback) {
    // element: This is the react element for App component
    // renderDom: This is the host root element to which the rendered app will be attached.
    // callback: if specified will be called after render is done.
    const isAsync = false;
    const parentContainer = null;
    // create root container
    const container = reconcilerInstance.createContainer(renderDom, isAsync);
    reconcilerInstance.updateContainer(
      element,
      container,
      parentContainer,
      callback
    );
    console.log("render called", element, renderDom, callback);
  },
};

module.exports = CustomRenderer;
