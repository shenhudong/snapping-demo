const deepClone = target => {
  if (target && typeof target === 'object') {
    const newObj = target instanceof Array ? [] : {}
    for (let key in target) {
      const val = target[key]
      newObj[key] = deepClone(val)
    }
    return newObj
  }

  return target
}

const dateFormat = (date, format = 'yyyy-MM-dd') => {
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  }
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (let k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
    }
  }
  return format
}

const bubbleSort = (arr, keyName) => {
  let len = arr.length

  const compare = keyName === undefined ? (i, j) => i > j : (i, j) => i[keyName] > j[keyName]

  for (let i = 0; i < len - 1; i++) {
    for (let j = 0; j < len - 1 - i; j++) {
      if (compare(arr[j], arr[j + 1])) { // 相邻元素两两对比
        let temp = arr[j + 1] // 元素交换
        arr[j + 1] = arr[j]
        arr[j] = temp
      }
    }
  }

  return arr
}

/**
 * 函数节流 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
 * @param fn         {function}  需要调用的函数
 * @param delay      {number}    延迟时间，单位毫秒
 * @param immediate  {bool}      给 immediate 参数传递 false，绑定的函数先执行，而不是delay后后执行
 * @return           {function}  实际调用函数
 */
let throttle = function(fn, delay, immediate = false, debounce = false) {
  let curr = +new Date()
  let last_call = 0
  let last_exec = 0
  let timer = null
  let diff
  let context
  let args
  const exec = function() {
    last_exec = curr
    fn.apply(context, args)
  }

  return function() {
    curr = +new Date()
    context = this
    args = arguments
    diff = curr - (debounce ? last_call : last_exec) - delay

    clearTimeout(timer)

    if (debounce) {
      if (immediate) {
        timer = setTimeout(exec, delay)
      } else if (diff >= 0) {
        exec()
      }
    } else {
      if (diff >= 0) {
        exec()
      } else if (immediate) {
        timer = setTimeout(exec, -diff)
      }
    }

    last_call = curr
  }
}

/**
 * 函数去抖 返回函数连续调用时，空闲时间必须大于或等于 delay，fn 才会执行
 * @param fn         {function}  需要调用的函数
 * @param delay      {number}    空闲时间，单位毫秒
 * @param immediate  {bool}      给 immediate 参数传递 false，绑定的函数先执行，而不是delay后后执行
 * @return           {function}  实际调用函数
 */
const debounce = function(fn, delay, immediate = false) {
  return throttle(fn, delay, immediate, true)
}

const delayExec = function(fn, delay) {
  let timer = null
  let context

  return function(...args) {
    context = this
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      fn.apply(context, args)
      timer = null
    }, delay)
  }
}

export {
  dateFormat,
  bubbleSort,
  throttle,
  debounce,
  deepClone,
  delayExec
}

export default {
  dateFormat,
  bubbleSort,
  throttle,
  debounce,
  deepClone,
  delayExec
}