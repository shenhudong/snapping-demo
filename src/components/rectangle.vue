<template>
  <rect
    :x="x + correctX"
    :y="y + correctY"
    :width="width"
    :height="height"
    stroke="#000"
    stroke-width="1"
    fill="transparent"
    @mousedown="dragElement"
  />
</template>

<script>
import common from '../common'

const THROTTLE_DELAY_TIME = 30

const Utils = {
  /**
   * 函数节流 返回函数连续调用时，fn 执行频率限定为每多少时间执行一次
   * @param fn         {function}  需要调用的函数
   * @param delay      {number}    延迟时间，单位毫秒
   * @param immediate  {bool}      给 immediate 参数传递 false，绑定的函数先执行，而不是delay后后执行
   * @return           {function}  实际调用函数
   */
  throttle(fn, delay, immediate = false, debounce = false) {
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
}

const pointsToSize = points => ({
  x: points[0][0],
  y: points[1][0],
  width: points[0][2] - points[0][0],
  height: points[1][2] - points[1][0],
})

const getPoints = (rect, correctX = 0, correctY = 0) => {
  const xMin = rect.x + correctX
  const xMid = rect.x + rect.width / 2 + correctX
  const xMax = rect.x + rect.width + correctX
  const yMin = rect.y + correctY
  const yMid = rect.y + rect.height / 2 + correctY
  const yMax = rect.y + rect.height + correctY

  return [
    [xMin, xMid, xMax],
    [yMin, yMid, yMax]
  ]
}

/**
 * Points [
 *   [xMin, xMid, xMax],
 *   [yMin, yMid, yMax]
 * ]
 */
export default {
  name: 'rectangle',
  props: ['id', 'points', 'getViewportRef', 'correctX', 'correctY'],
  data() {
    return pointsToSize(this.points)
  },
  watch: {
    points(val) {
      Object.assign(this, pointsToSize(val))
    }
  },
  methods: {
    dragElement(e) {
      let draged = false
      const viewportRef = this.getViewportRef()
      const mouseDownPosition = common.getPositionInSvg(viewportRef, e)
      const originPosition = {
        x: this.x,
        y: this.y
      }

      const dragMoveHandler = e => {
        draged = true
        const currentPosition = common.getPositionInSvg(viewportRef, e)

        Object.assign(this, {
          x: originPosition.x + currentPosition.x - mouseDownPosition.x,
          y: originPosition.y + currentPosition.y - mouseDownPosition.y,
        })

        this.$emit('draging', this.id, getPoints(this))
      }

      const mousemoveHandler = Utils.throttle(dragMoveHandler, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.$emit('update:points', getPoints(this, this.correctX, this.correctY))
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    }
  }
}
</script>