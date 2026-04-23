import type { Question } from '../types'

export const advancedQuestions: Question[] = [
  // 判断题示例
  {
    id: '1001-javascript',
    type: 'judge',
    category: 'javascript',
    question: 'JavaScript 中 `null == undefined` 返回 true',
    answer: true,
    explanation: '在 JavaScript 中，使用 == 进行比较时，null 和 undefined 被认为是相等的。但使用 === 严格相等时则不相等。',
  },
  {
    id: '1002-javascript',
    type: 'judge',
    category: 'javascript',
    question: '箭头函数可以使用 `arguments` 对象',
    answer: false,
    explanation: '箭头函数没有自己的 arguments 对象，如果在箭头函数中使用 arguments，它会引用外层函数的 arguments。可以使用剩余参数 ...args 代替。',
  },
  {
    id: '1003-vue3',
    type: 'judge',
    category: 'vue3',
    question: 'Vue3 的 Composition API 完全替代了 Options API',
    answer: false,
    explanation: 'Vue3 中 Composition API 和 Options API 可以共存，Options API 依然被完全支持。Composition API 是一种新的组织代码的方式，但不是强制的。',
  },

  // 填空题示例
  {
    id: '1004-javascript',
    type: 'fill',
    category: 'javascript',
    question: '在 JavaScript 中，可以使用 `___` 关键字声明块级作用域变量，使用 `___` 声明常量。',
    answer: ['let', 'const'],
    blanks: 2,
    explanation: 'let 用于声明块级作用域的变量，const 用于声明常量（不可重新赋值）。',
  },
  {
    id: '1005-vue3',
    type: 'fill',
    category: 'vue3',
    question: 'Vue3 中使用 `___` 函数创建响应式对象，使用 `___` 函数创建响应式引用。',
    answer: ['reactive', 'ref'],
    blanks: 2,
    explanation: 'reactive() 用于创建响应式对象，ref() 用于创建响应式引用（可用于基本类型和对象）。',
  },

  // 简答题示例
  {
    id: '1006-javascript',
    type: 'short',
    category: 'javascript',
    question: '请简述 JavaScript 事件循环（Event Loop）的执行顺序。',
    answer: '执行同步代码 -> 执行微任务队列 -> 执行宏任务队列 -> 重复',
    explanation: 'JavaScript 事件循环的基本流程：1) 执行同步代码；2) 执行所有微任务（Promise、MutationObserver）；3) 执行一个宏任务（setTimeout、setInterval）；4) 重复步骤2-3。',
  },
  {
    id: '1007-vue3',
    type: 'short',
    category: 'vue3',
    question: '简述 Vue3 中 watchEffect 和 watch 的主要区别。',
    answer: 'watchEffect 自动收集依赖并立即执行，watch 需要明确指定监听源',
    explanation: 'watchEffect 会自动追踪其内部使用的响应式数据，并在数据变化时重新执行，且会立即执行一次。而 watch 需要明确指定要监听的数据源，默认不会立即执行（除非设置 immediate: true）。',
  },

  // 代码题示例
  {
    id: '1008-javascript',
    type: 'code',
    category: 'javascript',
    question: '实现一个防抖函数 debounce，延迟 delay 毫秒后执行。',
    codeTemplate: `function debounce(fn, delay) {
  // 请在此处实现
}`,
    answer: `function debounce(fn, delay) {
  let timer = null
  return function(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}`,
    explanation: '防抖函数的核心思想是：在事件触发后延迟执行，如果在延迟期间再次触发，则重新计时。使用闭包保存 timer，每次调用时清除之前的定时器。',
  },
  {
    id: '1009-vue3',
    type: 'code',
    category: 'vue3',
    question: '使用 Composition API 创建一个计数器组合函数 useCounter。',
    codeTemplate: `function useCounter(initialValue = 0) {
  // 请在此处实现
}`,
    answer: `function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  const increment = () => count.value++
  const decrement = () => count.value--
  return { count, increment, decrement }
}`,
    explanation: '使用 ref 创建响应式计数器，提供增加和减少的方法。这是 Composition API 中组合函数的典型模式。',
  },

  // 排序题示例
  {
    id: '1010-javascript',
    type: 'order',
    category: 'javascript',
    question: '将以下 JavaScript 代码执行顺序排列正确：',
    options: [
      'console.log(1)',
      'setTimeout(() => console.log(2), 0)',
      'Promise.resolve().then(() => console.log(3))',
      'console.log(4)',
    ],
    answer: [0, 3, 2, 1], // 正确顺序：1 -> 4 -> 3 -> 2
    explanation: '执行顺序：同步代码先执行（1, 4），然后执行微任务 Promise（3），最后执行宏任务 setTimeout（2）。输出：1, 4, 3, 2',
  },
  {
    id: '1011-vue3',
    type: 'order',
    category: 'vue3',
    question: '将 Vue3 组件生命周期钩子按执行顺序排列：',
    options: [
      'onMounted',
      'onBeforeMount',
      'setup',
      'onBeforeUpdate',
    ],
    answer: [2, 1, 0, 3], // setup -> onBeforeMount -> onMounted -> onBeforeUpdate
    explanation: 'Vue3 Composition API 生命周期执行顺序：setup（最早） -> onBeforeMount -> onMounted -> onBeforeUpdate（数据更新时）。',
  },

  // 更多判断题
  {
    id: '1012-javascript',
    type: 'judge',
    category: 'javascript',
    question: 'async/await 是 Promise 的语法糖',
    answer: true,
    explanation: 'async/await 本质上是基于 Promise 的语法糖，使异步代码看起来像同步代码，更易读易维护。async 函数总是返回 Promise。',
  },
  {
    id: '1013-vue2',
    type: 'judge',
    category: 'vue2',
    question: 'Vue2 可以直接监听数组索引的变化',
    answer: false,
    explanation: 'Vue2 使用 Object.defineProperty 实现响应式，无法直接监听数组索引变化。需要使用 Vue.set 或数组变异方法（push、pop 等）。',
  },

  // 更多填空题
  {
    id: '1014-javascript',
    type: 'fill',
    category: 'javascript',
    question: 'ES6 中使用 `___` 可以展开数组或对象，使用 `___` 可以收集剩余参数。',
    answer: ['...', '...'],
    blanks: 2,
    explanation: '扩展运算符（...）既可以用于展开数组/对象，也可以用于收集剩余参数，具体作用取决于使用场景。',
  },
  {
    id: '1015-miniprogram',
    type: 'fill',
    category: 'miniprogram',
    question: '小程序中页面配置文件的扩展名是 `___`，全局配置文件名是 `___`。',
    answer: ['.json', 'app.json'],
    blanks: 2,
    explanation: '小程序每个页面都有对应的 .json 配置文件，全局配置文件是根目录的 app.json。',
  },
]
