import Common from '@/common'
import Utils from '@/utils'

const THROTTLE_DELAY_TIME = 30

const ResizeHandler = {
  name: 'resize-handler',
  props: {
    id: String,               // 编号
    size: Object,             // 定位、宽高
    corrected: Object,        // 修正值
    getViewportRef: Function, // 获取svg dom引用的方法
    scaling: Number,          // 缩放比值，用于控制手柄图形的大小
    selected: Boolean         // 选中态
  },
  data() {
    return {
      points: Common.sizeToPoints(this.size),
      currentSize: this.size,
      staticValue: {
        negativeThirty: Common.absoluteZoom(-30, scaling),
        four: Common.absoluteZoom(4, scaling)
      }
    }
  },
  watch: {
    size: {
      handler(size, oldVal) {
        this.points = Common.sizeToPoints(size)
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
    const current = {
      width: this.currentSize.width + this.corrected.width,
      height: this.currentSize.height + this.corrected.height,
      x: this.currentSize.x + this.corrected.x,
      y: this.currentSize.y + this.corrected.y,
      rotate: this.currentSize.rotate
    }
    const viewBox = `0 0 ${current.width} ${current.height}`

    return (
      <g>
        <rect
          fill="transparent"
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
          mousedown={this.dragElement}
        >
          <circle class="cursor-rotate"      onMousedown={this.dragRotateHandle}       cx="50%" cy={this.staticValue.negativeThirty} r={this.staticValue.four} fill="#16ea00" />
          <circle style="cursor:nwse-resize" onMousedown={this.dragTopLeftHandle}      title="top-left"      cx="0"    r={this.staticValue.four} cy="0"    />
          <circle style="cursor:ns-resize"   onMousedown={this.dragTopMiddleHandle}    title="top-middle"    cx="50%"  r={this.staticValue.four} cy="0"    />
          <circle style="cursor:nesw-resize" onMousedown={this.dragTopRightHandle}     title="top-right"     cx="100%" r={this.staticValue.four} cy="0"    />
          <circle style="cursor:nesw-resize" onMousedown={this.dragBottomLeftHandle}   title="bottom-left"   cx="0"    r={this.staticValue.four} cy="100%" />
          <circle style="cursor:ns-resize"   onMousedown={this.dragBottomMiddleHandle} title="bottom-middle" cx="50%"  r={this.staticValue.four} cy="100%" />
          <circle style="cursor:nwse-resize" onMousedown={this.dragBottomRightHandle}  title="bottom-right"  cx="100%" r={this.staticValue.four} cy="100%" />
          <circle style="cursor:ew-resize"   onMousedown={this.dragMiddleLeftHandle}   title="middle-left"   cx="0%"   r={this.staticValue.four} cy="50%"  />
          <circle style="cursor:ew-resize"   onMousedown={this.dragMiddleRightHandle}  title="middle-right"  cx="100%" r={this.staticValue.four} cy="50%"  />
        </svg>
      </g>
    )
  },
  methods: {
    ...handleMethods
  }
}

export default ResizeHandler