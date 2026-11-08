type AnyFn<TArgs extends unknown[]> = (...args: TArgs) => void

// 防抖函数
const debounce = <TArgs extends unknown[]>(fn: AnyFn<TArgs>, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  return function (...args: TArgs) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

// 节流函数 (Throttle)
const throttle = <TArgs extends unknown[]>(fn: AnyFn<TArgs>, delay: number) => {
  let lastTime = 0 // 记录上次执行的时间

  return function (...args: TArgs) {
    const now = Date.now() // 获取当前时间

    // 如果当前时间 - 上次执行时间 > 延迟时间，则执行函数
    if (now - lastTime >= delay) {
      lastTime = now
      fn(...args)
    }
    // 否则，什么也不做，等待下一个周期
  }
}

export { debounce, throttle }
