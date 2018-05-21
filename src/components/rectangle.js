import Common from '@/common'
import Utils from '@/utils'

const THROTTLE_DELAY_TIME = 30
const MINIMUM_SIZE = 4

const getPoint = (rect, center, position) => {
  let point

  switch(position) {
  case 'top-left':
    point = {
      x: rect.x,
      y: rect.y
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'top-middle':
    point = {
      x: rect.x + (rect.width / 2),
      y: rect.y
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'top-right':
    point = {
      x: rect.x + rect.width,
      y: rect.y
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'bottom-left':
    point = {
      x: rect.x,
      y: rect.y + rect.height
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'bottom-middle':
    point = {
      x: rect.x + (rect.width / 2),
      y: rect.y + rect.height
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'bottom-right':
    point = {
      x: rect.x + rect.width,
      y: rect.y + rect.height
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'middle-left':
    point = {
      x: rect.x,
      y: rect.y + (rect.height / 2)
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  case 'middle-right':
    point = {
      x: rect.x + rect.width,
      y: rect.y + (rect.height / 2)
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  default:
    point = {
      x: rect.x,
      y: rect.y
    }
    return Common.getRotatedPoint(point, center, rect.rotate)
  }
}

const getCenterPoint = (p1, p2) => ({
  x: p1.x + ((p2.x - p1.x) / 2),
  y: p1.y + ((p2.y - p1.y) / 2)
})

const getKeyVariable = function(position) {
  const viewportRef = this.getViewportRef()
  const rect = {
    x: this.currentSize.x,
    y: this.currentSize.y,
    width: this.currentSize.width,
    height: this.currentSize.height,
    rotate: this.currentSize.rotate
  }
  const center = {
    x: rect.x + (rect.width / 2),
    y: rect.y + (rect.height / 2)
  }
  const handlePoint = getPoint(rect, center, position)
  const sPoint = {
    x: center.x + Math.abs(handlePoint.x - center.x) * (handlePoint.x < center.x ? 1 : -1),
    y: center.y + Math.abs(handlePoint.y - center.y) * (handlePoint.y < center.y ? 1 : -1)
  }
  const proportion = this.workspace.lockProportions ? (rect.width / rect.height) : 1

  return {
    viewportRef,  // 页面SVG元素的引用（计算鼠标位置需要用到）
    rect,         // 元素原始几何信息（xy宽高）
    center,       // 元素原始中心点坐标
    handlePoint,  // 当前拖动手柄的虚拟坐标（旋转后的坐标）
    sPoint,       // 拖动手柄的对称点的坐标（假设拖动的是左上角手柄，那么他的对称点就是右下角的点）
    proportion    // 宽高比
  }
}

const handleMethods = {
  dragElement(e) {
    let draged = false
    const viewportRef = this.getViewportRef()
    const mouseDownPosition = Common.getPositionInSvg(viewportRef, e)
    const originPosition = {
      x: this.size.x,
      y: this.size.y
    }

    const dragMoveHandler = e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      Object.assign(this.currentSize, {
        x: originPosition.x + currentPosition.x - mouseDownPosition.x,
        y: originPosition.y + currentPosition.y - mouseDownPosition.y,
      })

      this.$emit('changing', this.id, 'move', this.currentSize)
    }

    const mousemoveHandler = Utils.throttle(dragMoveHandler, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && this.$emit('changed', this.id, this.correctedSize)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragRotateHandle(e) {
    let draged = false
    const viewportRef = this.getViewportRef()
    const rect = {
      x: this.current.x,
      y: this.current.y,
      width: this.current.width,
      height: this.current.height,
      rotate: this.current.rotate
    }

    const originCenter = {
      x: rect.x + (rect.width / 2),
      y: rect.y + (rect.height / 2)
    }

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      const a = Math.abs(currentPosition.x - originCenter.x)
      const b = Math.abs(currentPosition.y - originCenter.y)
      const c = Math.sqrt(a * a + b * b)
      let rotate = Math.round((Math.asin(b / c) / Math.PI * 180))

      // 第一象限
      if (currentPosition.x >= originCenter.x && currentPosition.y <= originCenter.y) {
        rotate = 90 - rotate
      }
      // 第二象限
      else if (currentPosition.x <= originCenter.x && currentPosition.y <= originCenter.y) {
        rotate = 270 + rotate
      }
      // 第三象限
      else if (currentPosition.x <= originCenter.x && currentPosition.y >= originCenter.y) {
        rotate = 270 - rotate
      }
      // 第四象限
      else if(currentPosition.x >= originCenter.x && currentPosition.y >= originCenter.y) {
        rotate = 90 + rotate
      }

      this.current.rotate = rotate === 360 ? 0 : parseInt(rotate)
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragTopLeftHandle(e) {
    let draged = false
    const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'top-left')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      let currentPosition = Common.getPositionInSvg(viewportRef, e)
      let newCenterPoint = getCenterPoint(currentPosition, sPoint)

      let newTopLeftPoint = Common.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)
      let newBottomRightPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

      let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
      let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

      if (this.workspace.lockProportions) {
        if (newWidth / newHeight > proportion) {
          newTopLeftPoint.x = newTopLeftPoint.x + Math.abs(newWidth - newHeight * proportion)
          newWidth = newHeight * proportion
        } else {
          newTopLeftPoint.y = newTopLeftPoint.y + Math.abs(newHeight - newWidth / proportion)
          newHeight = newWidth / proportion
        }

        let rotatedTopLeftPoint = Common.getRotatedPoint(newTopLeftPoint, newCenterPoint, rect.rotate)
        newCenterPoint = getCenterPoint(rotatedTopLeftPoint, sPoint)
        newTopLeftPoint = Common.getRotatedPoint(rotatedTopLeftPoint, newCenterPoint, -rect.rotate)
        newBottomRightPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        newWidth = newBottomRightPoint.x - newTopLeftPoint.x
        newHeight = newBottomRightPoint.y - newTopLeftPoint.y
      }

      if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
        return
      }

      Object.assign(this.currentSize, {
        x: newTopLeftPoint.x,
        y: newTopLeftPoint.y,
        height: newHeight,
        width: newWidth
      })

      this.$emit('changing', this.id, 'top-left', this.currentSize)
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      // draged && EventEmitter.$emit('change-element-geometric-properties', this.currentSize)
      draged && this.$emit('changed', this.id, this.correctedSize)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragTopMiddleHandle(e) {
    let draged = false
    const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'top-middle')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      const rotatedCurrentPosition = Common.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
      const rotatedTopMiddlePoint = Common.getRotatedPoint({
        x: handlePoint.x,
        y: rotatedCurrentPosition.y
      }, handlePoint, rect.rotate)

      const newHeight = Math.sqrt(Math.pow(rotatedTopMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedTopMiddlePoint.y - sPoint.y, 2), 2)
      const newCenter = {
        x: rotatedTopMiddlePoint.x - (Math.abs(sPoint.x - rotatedTopMiddlePoint.x) / 2) * (rotatedTopMiddlePoint.x > sPoint.x ? 1 : -1),
        y: rotatedTopMiddlePoint.y + (Math.abs(sPoint.y - rotatedTopMiddlePoint.y) / 2) * (rotatedTopMiddlePoint.y > sPoint.y ? -1 : 1)
      }

      if (newHeight < MINIMUM_SIZE) {
        return
      }

      if (isInvalidCenterPoint(handlePoint, newCenter, sPoint)) {
        return
      }

      Object.assign(this.current, {
        height: newHeight,
        y: newCenter.y - (newHeight / 2),
        x: newCenter.x - (rect.width / 2)
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragTopRightHandle(e) {
    let draged = false
    const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'top-right')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      let currentPosition = Common.getPositionInSvg(viewportRef, e)
      let newCenterPoint = getCenterPoint(currentPosition, sPoint)

      let newTopRightPoint = Common.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)
      let newBottomLeftPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

      let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
      let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

      if (this.workspace.lockProportions) {
        if (newWidth / newHeight > proportion) {
          newTopRightPoint.x = newTopRightPoint.x - Math.abs(newWidth - newHeight * proportion)
          newWidth = newHeight * proportion
        } else {
          newTopRightPoint.y = newTopRightPoint.y + Math.abs(newHeight - newWidth / proportion)
          newHeight = newWidth / proportion
        }

        let rotatedTopRightPoint = Common.getRotatedPoint(newTopRightPoint, newCenterPoint, rect.rotate)
        newCenterPoint = getCenterPoint(rotatedTopRightPoint, sPoint)
        newTopRightPoint = Common.getRotatedPoint(rotatedTopRightPoint, newCenterPoint, -rect.rotate)
        newBottomLeftPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        newWidth = newTopRightPoint.x - newBottomLeftPoint.x
        newHeight = newBottomLeftPoint.y - newTopRightPoint.y
      }

      if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
        return
      }

      Object.assign(this.current, {
        x: newBottomLeftPoint.x,
        y: newTopRightPoint.y,
        height: newHeight,
        width: newWidth
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragBottomLeftHandle(e) {
    let draged = false
    const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'bottom-left')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      let currentPosition = Common.getPositionInSvg(viewportRef, e)
      let newCenterPoint = getCenterPoint(currentPosition, sPoint)

      let newTopRightPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)
      let newBottomLeftPoint = Common.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)

      let newWidth = newTopRightPoint.x - newBottomLeftPoint.x
      let newHeight = newBottomLeftPoint.y - newTopRightPoint.y

      if (this.workspace.lockProportions) {
        if (newWidth / newHeight > proportion) {
          newBottomLeftPoint.x = newBottomLeftPoint.x + Math.abs(newWidth - newHeight * proportion)
          newWidth = newHeight * proportion
        } else {
          newBottomLeftPoint.y = newBottomLeftPoint.y - Math.abs(newHeight - newWidth / proportion)
          newHeight = newWidth / proportion
        }

        let rotatedBottomLeftPoint = Common.getRotatedPoint(newBottomLeftPoint, newCenterPoint, rect.rotate)
        newCenterPoint = getCenterPoint(rotatedBottomLeftPoint, sPoint)
        newBottomLeftPoint = Common.getRotatedPoint(rotatedBottomLeftPoint, newCenterPoint, -rect.rotate)
        newTopRightPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        newWidth = newTopRightPoint.x - newBottomLeftPoint.x
        newHeight = newBottomLeftPoint.y - newTopRightPoint.y
      }

      if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
        return
      }

      Object.assign(this.current, {
        x: newBottomLeftPoint.x,
        y: newTopRightPoint.y,
        height: newHeight,
        width: newWidth
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragBottomMiddleHandle(e) {
    let draged = false
    const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'bottom-middle')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      const rotatedCurrentPosition = Common.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
      const rotatedBottomMiddlePoint = Common.getRotatedPoint({
        x: handlePoint.x,
        y: rotatedCurrentPosition.y
      }, handlePoint, rect.rotate)

      const newHeight = Math.sqrt(Math.pow(rotatedBottomMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedBottomMiddlePoint.y - sPoint.y, 2), 2)
      const newCenter = {
        x: rotatedBottomMiddlePoint.x - (Math.abs(sPoint.x - rotatedBottomMiddlePoint.x) / 2) * (rotatedBottomMiddlePoint.x > sPoint.x ? 1 : -1),
        y: rotatedBottomMiddlePoint.y + (Math.abs(sPoint.y - rotatedBottomMiddlePoint.y) / 2) * (rotatedBottomMiddlePoint.y > sPoint.y ? -1 : 1)
      }

      if (newHeight < MINIMUM_SIZE) {
        return
      }

      if (isInvalidCenterPoint(handlePoint, newCenter, sPoint)) {
        return
      }

      Object.assign(this.current, {
        height: newHeight,
        y: newCenter.y - (newHeight / 2),
        x: newCenter.x - (rect.width / 2)
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragBottomRightHandle(e) {
    let draged = false
    const { viewportRef, sPoint, rect, proportion } = getKeyVariable.call(this, 'bottom-right')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      let currentPosition = Common.getPositionInSvg(viewportRef, e)
      let newCenterPoint = getCenterPoint(currentPosition, sPoint)

      let newTopLeftPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)
      let newBottomRightPoint = Common.getRotatedPoint(currentPosition, newCenterPoint, -rect.rotate)

      let newWidth = newBottomRightPoint.x - newTopLeftPoint.x
      let newHeight = newBottomRightPoint.y - newTopLeftPoint.y

      if (this.workspace.lockProportions) {
        if (newWidth / newHeight > proportion) {
          newBottomRightPoint.x = newBottomRightPoint.x - Math.abs(newWidth - newHeight * proportion)
          newWidth = newHeight * proportion
        } else {
          newBottomRightPoint.y = newBottomRightPoint.y - Math.abs(newHeight - newWidth / proportion)
          newHeight = newWidth / proportion
        }

        let rotatedBottomRightPoint = Common.getRotatedPoint(newBottomRightPoint, newCenterPoint, rect.rotate)
        newCenterPoint = getCenterPoint(rotatedBottomRightPoint, sPoint)
        newBottomRightPoint = Common.getRotatedPoint(rotatedBottomRightPoint, newCenterPoint, -rect.rotate)
        newTopLeftPoint = Common.getRotatedPoint(sPoint, newCenterPoint, -rect.rotate)

        newWidth = newBottomRightPoint.x - newTopLeftPoint.x
        newHeight = newBottomRightPoint.y - newTopLeftPoint.y
      }

      if (newWidth < MINIMUM_SIZE || (newHeight < MINIMUM_SIZE)) {
        return
      }

      Object.assign(this.current, {
        x: newTopLeftPoint.x,
        y: newTopLeftPoint.y,
        height: newHeight,
        width: newWidth
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragMiddleLeftHandle(e) {
    let draged = false
    const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'middle-left')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      const rotatedCurrentPosition = Common.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
      const rotatedLeftMiddlePoint = Common.getRotatedPoint({
        x: rotatedCurrentPosition.x,
        y: handlePoint.y
      }, handlePoint, rect.rotate)

      const newWidth = Math.sqrt(Math.pow(rotatedLeftMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedLeftMiddlePoint.y - sPoint.y, 2), 2)
      const newCenter = {
        x: rotatedLeftMiddlePoint.x - (Math.abs(sPoint.x - rotatedLeftMiddlePoint.x) / 2) * (rotatedLeftMiddlePoint.x > sPoint.x ? 1 : -1),
        y: rotatedLeftMiddlePoint.y + (Math.abs(sPoint.y - rotatedLeftMiddlePoint.y) / 2) * (rotatedLeftMiddlePoint.y > sPoint.y ? -1 : 1)
      }

      if (newWidth < MINIMUM_SIZE) {
        return
      }

      if (isInvalidCenterPoint(handlePoint, newCenter, sPoint)) {
        return
      }

      Object.assign(this.current, {
        width: newWidth,
        y: newCenter.y - (rect.height / 2),
        x: newCenter.x - (newWidth / 2)
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  },

  dragMiddleRightHandle(e) {
    let draged = false
    const { rect, viewportRef, sPoint, handlePoint } = getKeyVariable.call(this, 'middle-right')

    const mousemoveHandler = Utils.throttle(e => {
      draged = true
      const currentPosition = Common.getPositionInSvg(viewportRef, e)

      const rotatedCurrentPosition = Common.getRotatedPoint(currentPosition, handlePoint, -rect.rotate)
      const rotatedRightMiddlePoint = Common.getRotatedPoint({
        x: rotatedCurrentPosition.x,
        y: handlePoint.y
      }, handlePoint, rect.rotate)

      const newWidth = Math.sqrt(Math.pow(rotatedRightMiddlePoint.x - sPoint.x, 2) + Math.pow(rotatedRightMiddlePoint.y - sPoint.y, 2), 2)
      const newCenter = {
        x: rotatedRightMiddlePoint.x - (Math.abs(sPoint.x - rotatedRightMiddlePoint.x) / 2) * (rotatedRightMiddlePoint.x > sPoint.x ? 1 : -1),
        y: rotatedRightMiddlePoint.y + (Math.abs(sPoint.y - rotatedRightMiddlePoint.y) / 2) * (rotatedRightMiddlePoint.y > sPoint.y ? -1 : 1)
      }

      if (newWidth < MINIMUM_SIZE) {
        return
      }

      if (isInvalidCenterPoint(handlePoint, newCenter, sPoint)) {
        return
      }

      Object.assign(this.current, {
        width: newWidth,
        y: newCenter.y - (rect.height / 2),
        x: newCenter.x - (newWidth / 2)
      })
    }, THROTTLE_DELAY_TIME, true)

    const mouseupHandler = ev => {
      draged && EventEmitter.$emit('change-element-geometric-properties', this.current)
      window.removeEventListener('mousemove', mousemoveHandler)
      window.removeEventListener('mouseup', mouseupHandler)
    }

    window.addEventListener('mousemove', mousemoveHandler)
    window.addEventListener('mouseup', mouseupHandler)
  }
}

const ResizeHandler = {
  name: 'resize-handler',
  props: {
    id: String,               // 编号
    size: {                   // 定位、宽高
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotate: 0
      })
    },
    corrected: {              // 修正值
      type: Object,
      default: () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotate: 0
      })
    },
    getViewportRef: Function, // 获取svg dom引用的方法
    scaling: Number,          // 缩放比值，用于控制手柄图形的大小
    selected: Boolean         // 选中态
  },
  data() {
    return {
      workspace: {
        lockProportions: true
      },
      currentSize: {
        x: this.size.x,
        y: this.size.y,
        width: this.size.width,
        height: this.size.height,
        rotate: this.size.rotate
      },
      staticValue: {
        negativeThirty: Common.absoluteZoom(-30, this.scaling),
        four: Common.absoluteZoom(4, this.scaling),
        two: Common.absoluteZoom(2, this.scaling)
      }
    }
  },
  computed: {
    correctedSize() {
      return {
        x: this.currentSize.x + this.corrected.x,
        y: this.currentSize.y + this.corrected.y,
        width: this.currentSize.width + this.corrected.width,
        height: this.currentSize.height + this.corrected.height,
        rotate: this.currentSize.rotate
      }
    }
  },
  watch: {
    size: {
      handler(size, oldVal) {
        this.currentSize = size
      },
      deep: true
    },
    scaling(scaling) {
      this.staticValue.negativeThirty = Common.absoluteZoom(-30, scaling)
      this.staticValue.four = Common.absoluteZoom(4, scaling)
    }
  },
  render(h) {
    const current = this.correctedSize
    const viewBox = `0 0 ${current.width} ${current.height}`

    return (
      <g>
        <rect
          fill="none"
          stroke="#000"
          stroke-width="1"
          width={current.width}
          height={current.height}
          x={current.x}
          y={current.y}
        />
        <svg
          viewBox={viewBox}
          width={current.width}
          height={current.height}
          x={current.x}
          y={current.y}
          style="overflow:visible"
        >
          <rect width="100%" height="100%" fill="transparent" onMousedown={this.dragElement} />
          <g stroke="#000" stroke-width="1" fill="#fff">
            <line x1="50%" x2="50%" y1="0" y2={this.staticValue.negativeThirty} stroke-dasharray={this.staticValue.two} />
            <circle class="cursor-rotate"      onMousedown={this.dragRotateHandle}       cx="50%" cy={this.staticValue.negativeThirty} r={this.staticValue.four} fill="#16ea00" />
            <circle style="cursor:nwse-resize" onMousedown={this.dragTopLeftHandle}      title="top-left"      cx="0"    r={this.staticValue.four} cy="0"    />
            <circle style="cursor:ns-resize"   onMousedown={this.dragTopMiddleHandle}    title="top-middle"    cx="50%"  r={this.staticValue.four} cy="0"    />
            <circle style="cursor:nesw-resize" onMousedown={this.dragTopRightHandle}     title="top-right"     cx="100%" r={this.staticValue.four} cy="0"    />
            <circle style="cursor:nesw-resize" onMousedown={this.dragBottomLeftHandle}   title="bottom-left"   cx="0"    r={this.staticValue.four} cy="100%" />
            <circle style="cursor:ns-resize"   onMousedown={this.dragBottomMiddleHandle} title="bottom-middle" cx="50%"  r={this.staticValue.four} cy="100%" />
            <circle style="cursor:nwse-resize" onMousedown={this.dragBottomRightHandle}  title="bottom-right"  cx="100%" r={this.staticValue.four} cy="100%" />
            <circle style="cursor:ew-resize"   onMousedown={this.dragMiddleLeftHandle}   title="middle-left"   cx="0%"   r={this.staticValue.four} cy="50%"  />
            <circle style="cursor:ew-resize"   onMousedown={this.dragMiddleRightHandle}  title="middle-right"  cx="100%" r={this.staticValue.four} cy="50%"  />
          </g>
        </svg>
      </g>
    ) 
  },
  methods: {
    ...handleMethods
  }
}

export default ResizeHandler