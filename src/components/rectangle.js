import Common from '@/common'
import Utils from '@/utils'

const THROTTLE_DELAY_TIME = 30

const sizeToPoints = (rect, correctX = 0, correctY = 0) => {
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

export default {
  name: 'rectangle',
  props: ['id', 'points', 'getViewportRef', 'correctX', 'correctY'],
  data() {
    return Common.pointsToSize(this.points)
  },
  watch: {
    points(val) {
      Object.assign(this, Common.pointsToSize(val))
    }
  },
  render(h) {
    const viewBox = `0 0 ${width} ${height}`
    return (
      <g>
        <svg viewBox={viewBox}></svg>
        <rect
          fill="transparent"
          stroke="#000"
          stroke-width="1"
          width={this.width}
          height={this.height}
          x={x + this.correctX}
          y={y + this.correctY}
          mousedown={this.dragElement}
        />
      </g>
    )
  },
  methods: {
    dragElement(e) {
      let draged = false
      const viewportRef = this.getViewportRef()
      const mouseDownPosition = Common.getPositionInSvg(viewportRef, e)
      const originPosition = {
        x: this.x,
        y: this.y
      }

      const dragMoveHandler = e => {
        draged = true
        const currentPosition = Common.getPositionInSvg(viewportRef, e)

        Object.assign(this, {
          x: originPosition.x + currentPosition.x - mouseDownPosition.x,
          y: originPosition.y + currentPosition.y - mouseDownPosition.y,
        })

        this.$emit('draging', this.id, Common.sizeToPoints(this))
      }

      const mousemoveHandler = Utils.throttle(dragMoveHandler, THROTTLE_DELAY_TIME, true)

      const mouseupHandler = ev => {
        draged && this.$emit('update:points', Common.sizeToPoints(this, this.correctX, this.correctY))
        window.removeEventListener('mousemove', mousemoveHandler)
        window.removeEventListener('mouseup', mouseupHandler)
      }

      window.addEventListener('mousemove', mousemoveHandler)
      window.addEventListener('mouseup', mouseupHandler)
    }
  }
}