

## React架构

React架构主要包括三部分：

### React Core

主要作为上层应用，对外暴露顶级React API。比如

- React.createElement()
- React.createClass()
- React.Component
- React.Children
- React.PropTypes



### Renderer

React 最初是为 DOM(浏览器) 创建的，但后来经过调整，也支持使用 React Native 的原生平台。这将“渲染器”的概念引入到 React 内部。渲染器管理 React 树如何变成底层平台调用。

![img](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/common-reconciler.png)



### React DOM 或者 React Native

平台或者说宿主。这里补充两个概念：

- **Host Components**: 指的是运行于特定平台的组件，比如`<div>`,`<View>`。
- **Composite Components**: 复合组件指的是用户自定义的组件。比如`<MyButton>` or `<Content>`。



## 自定义渲染器

### 创建模板项目

```shell
npx create-react-app renderer
cd renderer
```

### 项目结构骨架

```
├── README.md
├── package.json
├── node_modules
├── public
├── src
│   ├── index.js #remove everything except index.js
│   └── renderer
│       └── index.js  #This is a new file
└── yarn.lock
```



### 入口文件

```javascript
import React from 'react'
import ReactDOM from 'react-dom'

const Text = props => {
  return <p className={props.className}>{props.content}</p>
}

const App = () => {
  return (
    <div>
      <Text className="hello-class" content="Hello" />
      <span style={{ color: 'blue' }}>World</span>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
```



### 启动

```shell
npm start
```

![boilerplate demo](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/boilerplate_start_demo.png)

我们可以看到浏览器正确渲染出`hello world`。

### 自定义渲染器第一次提交

**src/index.js**

```javascript
import React from 'react'
// import ReactDOM from "react-dom";
import CustomRenderer from './renderer'

const Text = props => {
  return <p className={props.className}>{props.content}</p>
}

const App = () => {
  return (
    <div>
      <Text className="hello-class" content="Hello" />
      <span style={{ color: 'blue' }}>World</span>
    </div>
  )
}

// ReactDOM.render(<App />, document.getElementById("root"));
CustomRenderer.render(<App />, document.getElementById('root'))
```

 **src/renderer/index.js**

```javascript
const CustomRenderer = {
  render(element, renderDom, callback) {
    // element: This is the react element for App component
    // renderDom: This is the host root element to which the rendered app will be attached.
    // callback: if specified will be called after render is done.
    console.log('render called', element, renderDom, callback)
  },
}

module.exports = CustomRenderer
```

启动项目我们看到结果：

![截屏2021-12-11 上午1.01.38](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-11%20%E4%B8%8A%E5%8D%881.01.38.png)



接下来看到报错后，我们可以参考其他渲染器相关的代码、文档。

- 我们发现`React` 团队将实验版本的 `react-reconciler` 导出为 npm 包，可单独使用。
- 每个平台的渲染器，无论是 `dom`、`react native` 等，都必须有自己的`hostConfig`，以及 `react-reconciler`。渲染器需要在` hostConfig `中实现所有必要的平台特定功能。渲染器中的` react-reconciler `模块将通过提供的` hostConfig` 调用平台特定的函数来执行` dom `更改或视图更新。

因此总结下来就是我们需要：自己实现一个`react-reconciler`示例。

![renderer in short](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/renderer_in_short.png)

### 安装react-reconciler

```shell
yarn add react-reconciler
```

修改**src/renderer/index.js**

```javascript
const Reconciler = require('react-reconciler')

const HostConfig = {
  //TODO We will specify all required methods here
}
const reconcilerInstance = Reconciler(HostConfig)

const CustomRenderer = {
  render(element, renderDom, callback) {
    // element: This is the react element for App component
    // renderDom: This is the host root element to which the rendered app will be attached.
    // callback: if specified will be called after render is done.

    const isAsync = false // Disables async rendering
    const container = reconcilerInstance.createContainer(renderDom, isAsync) // Creates root fiber node.

    const parentComponent = null // Since there is no parent (since this is the root fiber). We set parentComponent to null.
    reconcilerInstance.updateContainer(
      element,
      container,
      parentComponent,
      callback
    ) // Start reconcilation and render the result
  },
}

module.exports = CustomRenderer
```

我们可以简单介绍我们上述所做了哪些事情：

- 我们把`hostConfig`作为参数创建了一个`reconciler`实例。
- 我们通过 **reconcilerInstance.createContainer**.方法创建了一个与`renderDom`对应的`root fiber node（container）`。`container`将会被`reconciler`用来管理后续`renderDom`的更新。
- 我们最后调用**reconcilerInstance.updateContainer**方法，开启`reconcilation`。



可能你也发现我们设置`isAsync`为false，这个参数是用来控制fiber node的工作模式。设置为false标识禁用AsyncMode模式。

重新启动项目：

```shell
yarn start
```

我们会看到类似报错。



<img src="https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-11%20%E4%B8%8B%E5%8D%8810.55.01.png" alt="截屏2021-12-11 下午10.55.01" style="zoom:50%;" />



因为还没有在hostConfig中实现对应的很多方法。



## HostConfig

我们需要在hostConfig中实现平台所有必要的功能。

```javascript
const HostConfig = {
  //TODO We will specify all required methods here
}
```

参考[source code of **react-reconciler**](https://github.com/facebook/react/blob/dac9202a9c5add480f853bcad2ee04d371e72c0c/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js)源码我们看到所有的方法列表。

```javascript
export const getPublicInstance = $$$hostConfig.getPublicInstance;
export const getRootHostContext = $$$hostConfig.getRootHostContext;
export const getChildHostContext = $$$hostConfig.getChildHostContext;
export const prepareForCommit = $$$hostConfig.prepareForCommit;
export const resetAfterCommit = $$$hostConfig.resetAfterCommit;
export const createInstance = $$$hostConfig.createInstance;
export const appendInitialChild = $$$hostConfig.appendInitialChild;
export const finalizeInitialChildren = $$$hostConfig.finalizeInitialChildren;
export const prepareUpdate = $$$hostConfig.prepareUpdate;
export const shouldSetTextContent = $$$hostConfig.shouldSetTextContent;
export const shouldDeprioritizeSubtree =
  $$$hostConfig.shouldDeprioritizeSubtree;
export const createTextInstance = $$$hostConfig.createTextInstance;
export const scheduleDeferredCallback = $$$hostConfig.scheduleDeferredCallback;
export const cancelDeferredCallback = $$$hostConfig.cancelDeferredCallback;
export const scheduleTimeout = $$$hostConfig.setTimeout;
export const cancelTimeout = $$$hostConfig.clearTimeout;
export const noTimeout = $$$hostConfig.noTimeout;
export const now = $$$hostConfig.now;
export const isPrimaryRenderer = $$$hostConfig.isPrimaryRenderer;
export const supportsMutation = $$$hostConfig.supportsMutation;
export const supportsPersistence = $$$hostConfig.supportsPersistence;
export const supportsHydration = $$$hostConfig.supportsHydration;


// -------------------
//      Mutation
//     (optional)
// -------------------
export const appendChild = $$$hostConfig.appendChild;
export const appendChildToContainer = $$$hostConfig.appendChildToContainer;
export const commitTextUpdate = $$$hostConfig.commitTextUpdate;
export const commitMount = $$$hostConfig.commitMount;
export const commitUpdate = $$$hostConfig.commitUpdate;
export const insertBefore = $$$hostConfig.insertBefore;
export const insertInContainerBefore = $$$hostConfig.insertInContainerBefore;
export const removeChild = $$$hostConfig.removeChild;
export const removeChildFromContainer = $$$hostConfig.removeChildFromContainer;
export const resetTextContent = $$$hostConfig.resetTextContent;
export const hideInstance = $$$hostConfig.hideInstance;
export const hideTextInstance = $$$hostConfig.hideTextInstance;
export const unhideInstance = $$$hostConfig.unhideInstance;
export const unhideTextInstance = $$$hostConfig.unhideTextInstance;

// -------------------
//     Persistence
//     (optional)
// -------------------
export const cloneInstance = $$$hostConfig.cloneInstance;
export const createContainerChildSet = $$$hostConfig.createContainerChildSet;
export const appendChildToContainerChildSet =
  $$$hostConfig.appendChildToContainerChildSet;
export const finalizeContainerChildren =
  $$$hostConfig.finalizeContainerChildren;
export const replaceContainerChildren = $$$hostConfig.replaceContainerChildren;
export const cloneHiddenInstance = $$$hostConfig.cloneHiddenInstance;
export const cloneUnhiddenInstance = $$$hostConfig.cloneUnhiddenInstance;
export const createHiddenTextInstance = $$$hostConfig.createHiddenTextInstance;

// -------------------
//     Hydration
//     (optional)
// -------------------
export const canHydrateInstance = $$$hostConfig.canHydrateInstance;
export const canHydrateTextInstance = $$$hostConfig.canHydrateTextInstance;
export const getNextHydratableSibling = $$$hostConfig.getNextHydratableSibling;
export const getFirstHydratableChild = $$$hostConfig.getFirstHydratableChild;
export const hydrateInstance = $$$hostConfig.hydrateInstance;
export const hydrateTextInstance = $$$hostConfig.hydrateTextInstance;
export const didNotMatchHydratedContainerTextInstance =
  $$$hostConfig.didNotMatchHydratedContainerTextInstance;
export const didNotMatchHydratedTextInstance =
  $$$hostConfig.didNotMatchHydratedTextInstance;
export const didNotHydrateContainerInstance =
  $$$hostConfig.didNotHydrateContainerInstance;
export const didNotHydrateInstance = $$$hostConfig.didNotHydrateInstance;
export const didNotFindHydratableContainerInstance =
  $$$hostConfig.didNotFindHydratableContainerInstance;
export const didNotFindHydratableContainerTextInstance =
  $$$hostConfig.didNotFindHydratableContainerTextInstance;
export const didNotFindHydratableInstance =
  $$$hostConfig.didNotFindHydratableInstance;
export const didNotFindHydratableTextInstance =
  $$$hostConfig.didNotFindHydratableTextInstance;
```

看起来需要实现的API很多，不过实际上我们只需要提供部分必要的实现即可。

![shocked meme](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/shocked.gif)

在初始化渲染阶段，**Reconciler**会从hostconfig调用不同的函数。



## Initial render

首先我们打算渲染这样一个视图：

```react
const Text = props => {
  return <p className={props.className}>{props.content}</p>
}

const App = () => {
  return (
    <div>
      <Text className="hello-class" content="Hello" />
      <span style="color:blue;">World</span>
    </div>
  )
}
```

因此我们渲染的视图树大致应该是这样的。

![first render tree](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/first_render_view_tree.png)



现在我们看看之前的报错。

```
TypeError: getRootHostContext is not a function
```

```javascript
const HostConfig = {
  getRootHostContext: function(...args) {
    console.log('getRootHostContext', ...args)
  },
}
```

我们发现还有报错，继续挨个处理，最后得到如下的hostConfig。

处理这个`TypeError: appendAllChildren is not a function`报错时候，查到对应一个[issue](https://github.com/facebook/react/issues/15356)。

因为我们没有实现supportsMutation（它应该设置为true），因此一些内部函数没有被分配。

好了，终于没有报错了。

```javascript
const hostConfig = {
  getRootHostContext: function(...args) {
    console.log('getRootHostContext', ...args);
  },
  getChildHostContext: function(...args) {
    console.log('getChildHostContext', ...args)
  },
  shouldSetTextContent: function(...args) {
    console.log('shouldSetTextContent', ...args)
  },
  prepareForCommit: function(...args) {
    console.log('prepareForCommit', ...args)
  },
  resetAfterCommit: function(...args) {
    console.log('resetAfterCommit', ...args)
  },
  createTextInstance: function(...args) {
    console.log('createTextInstance', ...args)
  },
  createInstance: function(...args) {
    console.log('createInstance', ...args)
  },
  supportsMutation: function(...args) {
    console.log('createInstance', ...args)
    return true;
  },
  appendInitialChild: function(...args) {
    console.log('appendInitialChild', ...args)
  },
  clearContainer: function(...args) {
    console.log('appendInitialChild', ...args)
  },
  finalizeInitialChildren: function(...args) {
    console.log('finalizeInitialChildren', ...args)
  },
  appendChildToContainer: function(...args) {
    console.log('appendChildToContainer', ...args)
  },
};
```



![截屏2021-12-11 下午11.41.40](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-11%20%E4%B8%8B%E5%8D%8811.41.40.png)



这里最重要的是什么？当然是观测初始渲染时候执行的顺序：

![inital render flow](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/inital_render_tree_flow.png)



如果我们想要知道对应每个方法做了什么可以参考阅读[the source code of **react-dom** to ](https://github.com/facebook/react/blob/409e472fcaae2b6c171f4e9a0c4b5ad88ec2bf21/packages/react-dom/src/client/ReactDOMHostConfig.js#L97)源码。



### now

现在now不是必须得了，会有默认兜底方法。

```javascript
export {
  unstable_now as now,
  unstable_scheduleCallback as scheduleDeferredCallback,
  unstable_cancelCallback as cancelDeferredCallback,
} from 'scheduler';
```

协调器使用此函数来计算工作的当前时间。在 react-dom 的情况下，它使用 performace.now（如果可用）或降级到 Date.now。

### getRootHostContext

我们看到该函数的签名。

```javascript
function (rootContainerInstance: Container): HostContext {
  let context = {
    // This can contain any data that you want to pass down to immediate child
  }
  return context
}
```

参数：

	- rootContainerInstance就是我们在render时候指定的根dom节点，这里指的是`<div id="root"></div>`。

返回值：

- 返回的是一个context对象，这个context会传递给你的子child。

目的：

- 该函数允许您与此 HostConfig 中的其他函数共享一些上下文。

因此我们修改下demo返回一个空对象。

```typescript
getRootHostContext: function (rootContainerInstance: Container): HostContext {
  let rootContext = {
    from: 'from rootContext', // test code
  }
  return rootContext
}
```

![截屏2021-12-12 上午12.11.36](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8812.11.36.png)





### getChildHostContext

函数签名如下：

```typescript
function getChildHostContext(
  parentHostContext: HostContext,
  type: string,
  rootContainerInstance: Container,
): HostContext {
  let context = {
    // This can contain any data that you want to pass down to immediate child
  }
  return context
}
```

参数：

- parentHostContext: 来自父级的context对象，比如roothost传递给child的rootContext。
- type：这里主要指的是fiber类型。比如‘div’, ‘span’, ‘p’, ‘input’ etc.
- rootContainerInstance：指的是你在调用render时候指定的根dom节点。这里指的是`<div id="root"></div>`。

返回值：

- 您希望传递给直接子级的上下文对象。

目的：

- 这个函数提供了一种从父节点访问上下文的方法，也是一种将一些上下文传递给当前节点的直接子节点的方法。上下文基本上是一个包含一些信息的常规对象。

因此这里我们简单修改下我们的方法：

```javascript
  getChildHostContext: function (parentHostContext, type, rootContainerInstance) {
    console.log('getChildHostContext', parentHostContext, type, rootContainerInstance);
    let context = {
      from: 'from getChildHostContext'
    }
    return context
  },
```



![截屏2021-12-12 上午12.23.22](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8812.23.22.png)



### shouldSetTextConten

这个函数的签名如下：

```javascript
function shouldSetTextContent(type: string, props: Props): boolean {
  return Boolean
}
```

参数：

- type：这里主要指的是一些fiber type，比如‘div’, ‘span’, ‘p’, ‘input’ etc.
- props: 包括传递给host react element的props属性。

返回值: 

- 返回一个布尔值。

目的：

- 如果函数返回 true，则文本将在宿主元素内创建，并且不会单独创建新的文本元素。
- 如果返回 true，则接下来调用的是当前元素的 createInstance方法， 并且遍历将在此节点处停止（不会遍历此元素的子元素）。
- 如果返回 false，子元素将会继续调用**getChildHostContext**与**shouldSetTextContent**。它会一直持续到 shouldSetTextContent 返回 true 或者递归到树的最后一个node节点(通常是文本节点)。当它到达最后一个叶子节点时，它将调用 createTextInstance方法。

在 react-dom 的情况下，实现如下

```typescript
export function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}
```

因此自定义渲染这我们更改下对应的实现：

```javascript
  shouldSetTextContent: function(type, props) {
    console.log('shouldSetTextContent', type, props)
    return false;
  },
```

![截屏2021-12-12 上午12.46.05](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8812.46.05.png)



### createTextInstance

我们看其函数签名

```javascript
export function createTextInstance(
  text: string,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): TextInstance {
  return textNode
}
```

参数：

- text: 指的是需要被渲染使用的文本字符串
- rootContainerInstance：渲染时候指定的根node节点，`<div id="root"></div>`.
- hostContext：指的是包括当前text node的host node的context对象，比如`<p>Hello</p>`，`Hello`就是text node，它的`hostContext`指的就是`p`。
- internalInstanceHandle：指的是text instance对应的fiber node。

返回值：

- 这应该是一个实际的表示文本视图元素。在 dom(浏览器) 的情况下，它将是一个 textNode。

目的：

- 这里我们指定渲染器应该如何处理文本内容。



对应我们修改我们的方法：

```javascript
  createTextInstance: function(text, rootContainerInstance, hostContext, internalInstanceHandle) {
    console.log('createTextInstance', text, rootContainerInstance, hostContext, internalInstanceHandle)
    return document.createTextNode(text);
  },
```



![截屏2021-12-12 上午11.00.12](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.00.12.png)





### createInstance

对应函数签名

```javascript
export function createInstance(
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
  internalInstanceHandle: Object,
): Instance {
  return domElement
}
```

参数：

- type：主要指的是filber type，比如‘div’, ‘span’, ‘p’, ‘input’ etc.
- props：指的是传递给host react element的props属性
- rootContainerInstance：指的是渲染时候的root dom node。这里指的是`<div id="root"></div>`。
- hostContext：指的是当前node的父节点的context对象。它是其父节点**getChildHostContext**的返回值。
- internalInstanceHandle：实例对应的fiber node。

返回值:

- 节点Node实际对应的dom元素

目的：

- 除了子文本节点之外，所有的Host node都会调用该方法创建实例。所以我们需要根据host type创建正确对应的视图元素。
- 同时我们在这里处理传递给 host element 的props。比如设置onClickListeners或者样式。



对应我们的实现如下：

```javascript
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
    // if (newProps.onClick) {
    //   element.addEventListener('click', newProps.onClick)
    // }
    return element;
  },
```

![截屏2021-12-12 上午11.14.43](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.14.43.png)



### appendInitialChild

函数签名：

```typescript
export function appendInitialChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}
```



参数：

- parentInstance：遍历中的当前节点
- child：当前节点的子 dom 节点。

目的：

- 在这里，我们将在初始渲染阶段将子 dom 节点附加到父节点。将为当前节点的每个子节点调用此方法。



对应修改如下：

```javascript
  appendInitialChild: function (parentInstance, child) {
    console.log("appendInitialChild", parentInstance, child);
    parentInstance.appendChild(child)
  },
```

![截屏2021-12-12 上午11.19.27](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.19.27.png)



### finalizeInitialChildren

函数签名：

```javascript
export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
}
```



参数：

- domElement：domElement是appendInitialChild 之后的 dom 元素。
- type：fiber type,‘div’, ‘span’, ‘p’, ‘input’ etc.
- props：传递给 host react element 的 props。
- rootContainerInstance：根节点、这里指的是`<div id="root"></div>`。
- hostContext：它是其父节点**getChildHostContext**的返回值。

返回值：

- 布尔：一个布尔值，决定是否需要调用此元素的 commitMount。

目的：

- 在 react native 渲染器的情况下，这个函数除了返回 false 什么都不做。
- 在 react-dom 的情况下，这会添加默认的 dom 属性，例如事件侦听器等。为了实现某些input元素的autofocus（autofocus只能在渲染完成后发生），react-dom 发送返回类型为 true



因此我们对应修改为

```javascript
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
```

![截屏2021-12-12 上午11.34.29](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.34.29.png)



现在所有的子实例都创建完成。Reconciler 会将递归向上移动到该节点的父节点。请记住，当前节点的父节点还没有被实例化。因此，Reconciler将向上调用父级上的 createInstance → appendInitialChild → finalizeInitialChildren。这个循环会一直发生，直到我们到达递归树的顶部。当没有更多元素时，将调用 prepareForCommit。



### prepareForCommit

函数签名：

```typescript
function prepareForCommit(containerInfo: Container): void
```

参数：

- containerInfo：根node节点，这里指的是`<div id="root"></div>`。

目的：

- 当我们完成制作了所有视图的内存渲染树时，将调用此函数（请记住，我们尚未将其添加到实际的根 dom 节点）。在这里，我们可以在添加内存渲染树之前在 containerInfo 上做任何需要做的准备。例如：在 react-dom 的情况下，它会跟踪所有当前聚焦的元素、暂时禁用的事件等。

![截屏2021-12-12 上午11.45.59](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.45.59.png)



在 prepareForCommit 之后，reconciler 会将内存树提交到 rootHost，然后浏览器将触发重绘。



### resetAfterCommit

函数签名：

```typescript
export function resetAfterCommit(containerInfo: Container): void {
  ReactInputSelection.restoreSelection(selectionInformation);
  selectionInformation = null;
  ReactBrowserEventEmitter.setEnabled(eventsEnabled);
  eventsEnabled = null;
}
```

参数：

- **rootContainerInstance**: 渲染挂载的根节点,`<div id="root"></div>`。

目的：

- 在将内存树附加到根 dom 元素后，将执行此函数。在这里，我们可以执行任何需要完成的 post attach 操作。例如：react-dom 重新启用在 prepareForCommit 中暂时禁用的事件并重新聚焦元素等。

因此我们修改如下：

```javascript
  resetAfterCommit: function (containerInfo) {
    console.log("resetAfterCommit", containerInfo);
  },
```



现在在此为止，我们希望我们的文档被渲染，但事实并没有。问题是我们没有通过代码告诉如何将我们的内存树附加到root div。答案是 appendChildToContainer方法。



### appendChildToContainer

函数签名：

```javascript
export function appendChildToContainer(
  container: DOMContainer,
  child: Instance | TextInstance,
): void {}
```

参数：

- container：root node 或者 其他容器元素。
- child：子 dom 节点树或内存树。



目的：

- 在这里，我们将我们的内存树挂载到root div。但是这个函数只有在我们设置了 supportsMutation:true 时才有效。



我们对应修改如下： 

```javascript
  appendChildToContainer: function (container, child) {
    console.log("appendChildToContainer", container, child);
    container.appendChild(child);
  },
```



![截屏2021-12-12 上午11.56.33](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.56.33.png)

![截屏2021-12-12 上午11.56.49](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8A%E5%8D%8811.56.49.png)



😄，我们实现了一个迷你版本的React。

![hell_yeah](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/hell_yeah.gif)![hell yeah]()



让我们在完成之前继续实现commitMount。

### commitMount

函数签名：

```javascript
export function commitMount(
  domElement: Instance,
  type: string,
  newProps: Props,
  internalInstanceHandle: Object,
): void {}
```

参数：

- domElement：再次渲染的dom element
- type：fiber type，‘div’, ‘span’, ‘p’, ‘input’ etc
- newProps：传递给host react element 的 props
- internalInstanceHandle：该element对应的fiber node。



目的：

- 对于将 finalizeInitialChildren 的返回值设置为 true 的每个元素，都会调用此函数。在所有步骤完成后（即在 resetAfterCommit 之后）调用此方法，这意味着整个树已附加到 dom。该方法在react-dom主要用于实现自动对焦。这个方法只存在于 react-dom 中，不存在于 react-native 中。



对应我们的修改

```javascript
  commitMount: (domElement, type, newProps, fiberNode) => {
    domElement.focus();
    console.log("commitMount", domElement, type, newProps, fiberNode);
 },
```



到目前为止，hostConfig如下：

```javascript
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
    // if (newProps.onClick) {
    //   element.addEventListener('click', newProps.onClick)
    // }
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
};
```

现在我们已经完成微小版本的渲染器。

![like a boss](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/like_a_boss.gif)





现在我们已经完成静态的渲染，现在让我们向我们的应用程序添加状态，并使用一个按钮来改变点击状态，看看会发生什么。



## updated



我们修改src/index.js

```javascript
import React from 'react'
// import ReactDOM from "react-dom";
import CustomRenderer from './renderer'

const Text = props => {
  return <p className={props.className}>{props.content}</p>
}

class App extends React.Component {
  state = {
    text: Date.now(),
  }
  onButtonClick = () => {
    this.setState(() => ({ text: Date.now() }))
  }
  render() {
    return (
      <div>
        <Text className="hello-class" content={this.state.text} />
        <span style="color:blue;" autofocus>
          World
        </span>
        <button onClick={this.onButtonClick}>Get current time</button>
      </div>
    )
  }
}

// ReactDOM.render(<App />, document.getElementById("root"));
CustomRenderer.render(<App />, document.getElementById('root'))
```

看下界面如下：

![added a new button](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/added_btn.png)

当您尝试单击按钮时，我们看到没有任何反应。发生这种情况是因为我们的 onClick 侦听器没有被调用。

发生这种情况的原因是我们的渲染器不知道如何处理按钮上的 onClick 属性。让我们将该功能添加到我们的 hostConfig。

```javascript
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
      element.addEventListener('click', props.onClick)
    }
    return element;
  },
```

但是当我们点击时候，发现报错了。

![截屏2021-12-12 下午1.04.40](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8B%E5%8D%881.04.40.png)



我们继续维护我们的hostConfig。

### prepareUpdate

函数签名：

```typescript
export function prepareUpdate(
  domElement: Instance,
  type: string,
  oldProps: Props,
  newProps: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): null | Array<mixed> {
  return {
    /* update payload */
  }
}
```



参数：

- domElement: 当前node的dom实例
- type：fiber type，‘div’, ‘span’, ‘p’, ‘input’ etc.
- oldProps：更新之前的props
- newProps：新的props
- rootContainerInstance: root根节点,` <div id="root"></div>`。
- hostContext：这是父节点的 getChildHostContext 的返回值。

返回值：

- 这个函数应该返回一个payload object。 Payload 是一个 Javascript 对象，它可以包含有关此宿主元素上需要更改的内容的信息。

- 如果此函数不返回任何内容，则协调器会根据其算法决定是否应在此节点上执行更新。
- 这个想法是我们不会在这个函数中执行任何 dom 更改。 Dom 更改应该只在渲染器的提交阶段完成。一旦完成prepareUpdate 的树遍历，就会在rootContainerInstance 上调用prepareForCommit 方法，然后在我们从prepareUpdate 返回updatePayload 的每个节点上调用commitUpdate。





### **commitUpdate**

函数签名：

```typescript
export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  return {
    /* update payload */
  }
}
```

如果需要，我们应该在这里完成我们所有的 dom 操作工作。



### commitTextUpdate

函数签名

```typescript
export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string,
): void {
  textInstance.nodeValue = newText;
}
```



在这里我们对 textNode 执行实际的 dom 更新。

```javascript
commitTextUpdate: function(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
}
```

现在，让我们运行我们的应用程序，看看会发生什么。单击“获取当前时间”按钮👊🏽。我们的文本字段现在应该更新为状态中的最新值。 🥳🥳🥳

![截屏2021-12-12 下午1.23.51](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/%E6%88%AA%E5%B1%8F2021-12-12%20%E4%B8%8B%E5%8D%881.23.51.png)



## 执行更新的顺序

如果您在 React Dom 源代码中看到 hostConfig 中所有函数的列表，您应该会看到许多尚未涵盖但似乎与更新功能有些相关的函数。在尝试了很多demo之后，这是作者想出的执行顺序。

![update flow](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/update_flow_draw_io-20211212132538310.png)

![update_flow_draw_io](https://note-assets-1257150743.cos.ap-guangzhou.myqcloud.com/img/update_flow_draw_io.png)



这涵盖了首次渲染和后续更新期间渲染器的所有基本方法。



## Methods used for edge cases (during Commit Phase) 

现在如果你看一下hostConfig，你会发现还有一些方法没有涉及到。如果您更多地使用渲染器，您会发现其中一些方法将在某些边缘情况下被触发。



### appendChild

函数签名：

```typescript
export function appendChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.appendChild(child);
}
```



目的：

- 每当需要在最后将新元素插入到父元素中时，都会调用此函数。例如：

```react
<div>
  <p>test</p>
  {this.state.test === "yolo" && <button>Hello</button>}
</div>
```

所以这里当 state.test 变成 yolo 时。此函数将在提交阶段使用 parentInstance = div 和 child = button 调用。

因为我们添加如下：

```typescript
appendChild: function(parentInstance, child) {
    parentInstance.appendChild(child);
}
```



### insertBefore

函数签名：

```typescript
export function insertBefore(
  parentInstance: Instance,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  parentInstance.insertBefore(child, beforeChild);
}
```

每当需要在父元素内的子元素之前插入新元素时，都会调用此函数。例如：

```react
<div>
  <p>test</p>
  {this.state.test === "yolo" && <button>Hello</button>}
  <p>test2</p>
</div>
```

所以这里当 state.test 变成 yolo 时。在提交阶段，将使用 parentInstance = div, beforeChild = p(test2) , child = button 调用此函数。

因此我们添加如下：

```javascript
insertBefore: (parentInstance, child, beforeChild) => {
  parentInstance.insertBefore(child, beforeChild)
}
```

### removeChild

函数签名：

```typescript
export function removeChild(
  parentInstance: Instance,
  child: Instance | TextInstance,
): void {
  parentInstance.removeChild(child);
}

```

每当需要从父元素中删除元素时，都会调用此函数。例如：

```react
<div>{this.state.test === "yolo" && <button>Hello</button>}</div>
```

所以当 state.test 变成 yolo 以外的东西时。此函数将在提交阶段使用 parentInstance = div 和 child = button 调用。

因此我们添加如下：

```javascript
removeChild: function(parentInstance, child) {
 parentInstance.removeChild(child);
}
```

### insertInContainerBefore

函数签名：

```typescript
export function insertInContainerBefore(
  container: Container,
  child: Instance | TextInstance,
  beforeChild: Instance | TextInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}
```

每当元素需要插入到最顶层组件（根组件）本身之前，就会调用此函数。例如：

```react
const App = () => (
  <>
    {this.state.test === 'yolo' && <button>Hello</button>}
    <div> World</div>
  </>
)
```

所以这里当 state.test 变成 yolo 时。在提交阶段，将使用 container = root#div 和 child = div(World) 和 beforeChild = button 调用此函数。

因此我们添加如下：

```javascript
insertInContainerBefore: function(container, child, beforeChild) {
  container.insertBefore(child, beforeChild);
}
```



### removeChildFromContainer

函数签名：

```typescript
export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode: any).removeChild(child);
  } else {
    container.removeChild(child);
  }
}
```

每当元素出现在顶层节点并且需要删除时，就会调用此函数。例如：

```react
const App = () => (
  <>
    {this.state.test === 'yolo' && <button>Hello</button>}
    <div> World</div>
  </>
)
```

所以这里当 state.test 变成 NOT yolo 时。该函数将在提交阶段使用 container = root#div 和 child=button 调用。

因此我们添加如下：

```javascript
removeChildFromContainer: function(container, child) {
  container.removeChild(child);
}
```

### resetTextContent

函数签名:

```typescript
export function resetTextContent(domElement: Instance): void {
  setTextContent(domElement, '');
}
```

它在 react-dom 中用于重置 dom 元素的文本内容。

我们这里暂时不做任何处理。

```javascript
resetTextContent: function(domElement) {

}
```



## Extra Methods

这些包含我能够找出的 hostConfig 中的其余方法。如果阅读此博客的人能帮助我在下面的评论部分中弄清楚 hostConfig 中的其余方法的作用，我将不胜感激。然后我会在这里添加它们。



### shouldDeprioritizeSubtree

函数签名：

```typescript
export function shouldDeprioritizeSubtree(type: string, props: Props): boolean {
  return !!props.hidden;
}
```

此函数用于降低某些子树的渲染优先级。主要用于子树隐藏或屏幕外的情况。在 react-dom 代码库中，此函数如上所述。

因此我们修改如下：

```javascript
shouldDeprioritizeSubtree: function(type, nextProps) {
  return !!nextProps.hidden
}
```



## Final hostConfig



我们最终的配置如下：

```javascript
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
```

现在有很多的方法，我仍然不确定它们的用途。我在下面制作了一个状态跟踪器，用于跟踪我迄今为止所知道的信息。当我找到更多细节时，我会继续更新它。

```javascript
------
LEGEND
------
✅ - Means I figured what these methods do.
🔔 - Have some idea but not completely sure. Need help with these.
❌ - No freakin idea what these do. Need help with these.


$$$hostConfig.getPublicInstance; - ✅
$$$hostConfig.getRootHostContext; - ✅
$$$hostConfig.getChildHostContext; - ✅
$$$hostConfig.prepareForCommit; - ✅
$$$hostConfig.resetAfterCommit; - ✅
$$$hostConfig.createInstance; - ✅
$$$hostConfig.appendInitialChild; - ✅
$$$hostConfig.finalizeInitialChildren; - ✅
$$$hostConfig.prepareUpdate; - ✅
$$$hostConfig.shouldSetTextContent; - ✅
$$$hostConfig.shouldDeprioritizeSubtree; - ✅
$$$hostConfig.createTextInstance; - ✅
$$$hostConfig.scheduleDeferredCallback; - ❌
$$$hostConfig.cancelDeferredCallback; - ❌
$$$hostConfig.setTimeout; - 🔔 React Suspense stuff: Provide an implementation of setTimeout here to help in pause execution
$$$hostConfig.clearTimeout; - 🔔 React Suspense stuff: Provide an implementation of clearTimeout
$$$hostConfig.noTimeout; - 🔔 React Suspense stuff: Usually set it to -1. But can be any ID that setTimeout doesnt provide. So that it can be used to check if timeout handler is present or not
$$$hostConfig.now; - ✅
$$$hostConfig.isPrimaryRenderer; - 🔔 Set this to true. This is primarily used in codebase to manage context if there are more than one renderers I think. This is the hunch I got after reading the codebase.
$$$hostConfig.supportsMutation; - ✅
$$$hostConfig.supportsPersistence; - 🔔❌ set this to false. Current react-dom doesnt support it yet aswell.
$$$hostConfig.supportsHydration; - 🔔❌ set this to false. Enable if you can support hydration. More on hydration here: https://reactjs.org/docs/react-dom.html#hydrate
-------------------
     Mutation
    (optional)
-------------------
$$$hostConfig.appendChild; - ✅
$$$hostConfig.appendChildToContainer; - ✅
$$$hostConfig.commitTextUpdate; - ✅
$$$hostConfig.commitMount; - ✅
$$$hostConfig.commitUpdate; - ✅
$$$hostConfig.insertBefore; - ✅
$$$hostConfig.insertInContainerBefore; - ✅
$$$hostConfig.removeChild; - ✅
$$$hostConfig.removeChildFromContainer; - ✅
$$$hostConfig.resetTextContent; - 🔔
$$$hostConfig.cloneInstance; - 🔔❌ This will be used for persistence
$$$hostConfig.createContainerChildSet; - 🔔❌ This will be used for persistence
$$$hostConfig.appendChildToContainerChildSet; - 🔔❌ This will be used for persistence
$$$hostConfig.finalizeContainerChildren; - 🔔❌ This will be used for persistence
$$$hostConfig.replaceContainerChildren; - 🔔❌ This will be used for persistence
-------------------
    Hydration
    (optional)
-------------------
$$$hostConfig.canHydrateInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.canHydrateTextInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.getNextHydratableSibling; - 🔔❌ This will be used for hydration
$$$hostConfig.getFirstHydratableChild; - 🔔❌ This will be used for hydration
$$$hostConfig.hydrateInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.hydrateTextInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotMatchHydratedContainerTextInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotMatchHydratedTextInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotHydrateContainerInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotHydrateInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotFindHydratableContainerInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotFindHydratableContainerTextInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotFindHydratableInstance; - 🔔❌ This will be used for hydration
$$$hostConfig.didNotFindHydratableTextInstance; - 🔔❌ This will be used for hydration
```



## 参考资料

- [Fun With Fiber Custom Renderers - Ken Wheeler](https://www.youtube.com/watch?v=oPofnLZZTwQ)

- [Dan Abramov: Beyond React 16 | JSConf Iceland](https://www.youtube.com/watch?v=nLF0n9SACd4)

- [Lin Clark - A Cartoon Intro to Fiber - React Conf 2017](https://www.youtube.com/watch?v=ZCuYPiUIONs)

- https://github.com/facebook/react/tree/master/packages/react-dom

- https://medium.com/@agent_hunt/react-is-also-the-llvm-for-creating-declarative-ui-frameworks-767e75ce1d6a

- https://medium.com/@agent_hunt/hello-world-custom-react-renderer-9a95b7cd04bc

- https://github.com/nitin42/Making-a-custom-React-renderer

- https://goshakkk.name/react-custom-renderers/

- https://hackernoon.com/learn-you-some-custom-react-renderers-aed7164a4199

- Building React From Scratch by Paul O Shannessy - https://www.youtube.com/watch?v=\_MAD4Oly9yg

- https://reactjs.org/docs/react-api.html

- https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html

- https://reactjs.org/docs/jsx-in-depth.html

- https://reactjs.org/docs/implementation-notes.html

- https://giamir.com/what-is-react-fiber

- React Suspense implementation by Kent C. Dodds : https://www.youtube.com/watch?v=7LmrS2sdMlo

- https://github.com/sw-yx/fresh-async-react

- https://github.com/acdlite/react-fiber-architecture

- https://reactjs.org/docs/codebase-overview.html

  