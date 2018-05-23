import Common from '@/common'
import Utils from '@/utils'
import ResizeHandler from './resize-handler'

// 吸附阈值
const DISTANCE_THRESHOLD = 8

const RectList = [
  {x: 124, y: 125, width: 100, height: 100, rotate: 0},
  {x: 723, y: 265, width: 200, height: 130, rotate: 0},
  {x: 482, y: 422, width: 130, height: 200, rotate: 0},
  {x: 208, y: 402, width: 231, height: 503, rotate: 0}
]

// 重置参考物的线框尺寸
const resetReferenceShape = () => [
  {x: 0, y: 0, width: 0, height: 0},
  {x: 0, y: 0, width: 0, height: 0}
]

export default {
  name: 'svg-canvas',
  data() {
    const ID_TEMPLATE = +new Date()

    const shapeList = RectList.map((rect, i) => {
      return {
        id: String(ID_TEMPLATE + i),
        ...rect
      }
    })

    return {
      shapeList,

      dragingShapeId: null, // 拖拽中的图形
      measuringLine: [ // 吸附参考线
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ],
      referenceShape: resetReferenceShape(), // 参考物线框
      corrected: { // 修正值
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }
  },
  render(h) {
    return (
      <svg viewBox="0 0 1000 1000" width="800" height="800" ref="svg">
        <rect width="100%" height="100%" fill="none" stroke="#000" x="0" y="0" />
        {
          this.shapeList.map((shape, i) => {
            const correctedProps = shape.id === this.dragingShapeId ? {
              corrected: this.corrected
            } : {}

            if (shape.id === this.dragingShapeId) {
              return (
                <ResizeHandler
                  key={shape.id}
                  id={shape.id}
                  size={shape}
                  getViewportRef={this.getViewportRef}
                  onChanging={this.handleChangingShape}
                  onChanged={this.handleChangedShape}
                  scaling={100}
                  corrected={this.corrected}
                />
              )
            }

            return (
              <ResizeHandler
                key={shape.id}
                id={shape.id}
                size={shape}
                getViewportRef={this.getViewportRef}
                onChanging={this.handleChangingShape}
                onChanged={this.handleChangedShape}
                scaling={100}
              />
            )
          })
        }
        <line
          x1={this.measuringLine[0][0][0]}
          y1={this.measuringLine[0][0][1]}
          x2={this.measuringLine[0][1][0]}
          y2={this.measuringLine[0][1][1]}
          stroke="#f00"
          stroke-width="2"
        />
        <line
          x1={this.measuringLine[1][0][0]}
          y1={this.measuringLine[1][0][1]}
          x2={this.measuringLine[1][1][0]}
          y2={this.measuringLine[1][1][1]}
          stroke="#f00"
          stroke-width="2"
        />
        <g stroke="#f00" stroke-width="2" fill="none">
          <rect
            x={this.referenceShape[0].x}
            y={this.referenceShape[0].y}
            width={this.referenceShape[0].width}
            height={this.referenceShape[0].height}
          />
          <rect
            x={this.referenceShape[1].x}
            y={this.referenceShape[1].y}
            width={this.referenceShape[1].width}
            height={this.referenceShape[1].height}
          />
        </g>
      </svg>
    )
  },
  methods: {
    getViewportRef() {
      return this.$refs.svg
    },

    /**
     * 形状处于变化时的回调（用于计算吸附校正）
     * 
     * @param {String} shapeId          形状编号
     * @param {String} handler          触发变化的手柄，有10种值：
     *                                    move (位移), rotate (旋转),
     *                                    top-left (左上), top-middle (中上), top-right (右上),
     *                                    bottom-left (左下), bottom-middle (中下), bottom-right (右下),
     *                                    middle-left (中左), meddle-right (中右)
     * @param {Array}  currentSize      实时尺寸大小
     * @param {Object} handlerPosition  手柄坐标
     * @param {Object} mousePosition    鼠标坐标（当锁定比例时，鼠标坐标不等于手柄坐标）
     */
    handleChangingShape(shapeId, handler, currentSize, handlerPosition, mousePosition) {
      if (currentSize.rotate > 0) {
        return
      }

      const dragingShapePoints = Common.sizeToPoints(currentSize)
      const measuringLineX = [[0, 0], [0, 0]]
      const measuringLineY = [[0, 0], [0, 0]]
      const referenceShape = [
        {x: 0, y: 0, width: 0, height: 0},
        {x: 0, y: 0, width: 0, height: 0}
      ]

      // 拖拽中的元素与参考元素的x轴关系值
      let closestX = {
        points: null,       // 参考对象的关键点集合
        distance: Infinity, // 与参考对象的x轴关键点的差值绝对值的最小值
        pointIndex: 0,      // 参考的关键点索引 0: xMin, 1: xMid, 2: xMax
        correct: 0          // x轴修正值
      }

      let closestY = {
        points: null,
        distance: Infinity,
        pointIndex: 0,
        correct: 0
      }

      const getClosestXFunc = shapePoints => diff => {
        const distance = Math.abs(diff[0])
        if (distance < closestX.distance && (distance < DISTANCE_THRESHOLD)) {
          closestX = {
            distance,
            pointIndex: diff[1],
            points: shapePoints,
            correct: diff[0]
          }
        }
      }

      const getClosestYFunc = shapePoints => diff => {
        const distance = Math.abs(diff[0])
        if (distance < closestY.distance && (distance < DISTANCE_THRESHOLD)) {
          closestY = {
            distance,
            pointIndex: diff[1],
            points: shapePoints,
            correct: diff[0]
          }
        }
      }

      if (handler === 'move') {
        this.shapeList.forEach(shape => {
          if (shape.id === shapeId || (shape.rotate > 0)) {
            return
          }

          const shapePoints = Common.sizeToPoints(shape)

          const pointXDiff = [
            [shapePoints[0][0] - dragingShapePoints[0][0], 0],
            [shapePoints[0][0] - dragingShapePoints[0][1], 0],
            [shapePoints[0][0] - dragingShapePoints[0][2], 0],
            [shapePoints[0][1] - dragingShapePoints[0][0], 1],
            [shapePoints[0][1] - dragingShapePoints[0][1], 1],
            [shapePoints[0][1] - dragingShapePoints[0][2], 1],
            [shapePoints[0][2] - dragingShapePoints[0][0], 2],
            [shapePoints[0][2] - dragingShapePoints[0][1], 2],
            [shapePoints[0][2] - dragingShapePoints[0][2], 2]
          ]

          const pointYDiff = [
            [shapePoints[1][0] - dragingShapePoints[1][0], 0],
            [shapePoints[1][0] - dragingShapePoints[1][1], 0],
            [shapePoints[1][0] - dragingShapePoints[1][2], 0],
            [shapePoints[1][1] - dragingShapePoints[1][0], 1],
            [shapePoints[1][1] - dragingShapePoints[1][1], 1],
            [shapePoints[1][1] - dragingShapePoints[1][2], 1],
            [shapePoints[1][2] - dragingShapePoints[1][0], 2],
            [shapePoints[1][2] - dragingShapePoints[1][1], 2],
            [shapePoints[1][2] - dragingShapePoints[1][2], 2]
          ]

          const getClosestX = getClosestXFunc(shapePoints)
          const getClosestY = getClosestYFunc(shapePoints)

          pointXDiff.forEach(getClosestX)
          pointYDiff.forEach(getClosestY)
        })
      } else if (handler !== 'rotate') {
        this.shapeList.forEach(shape => {
          if (shape.id === shapeId || (shape.rotate > 0)) {
            return
          }

          const shapePoints = Common.sizeToPoints(shape)

          const pointXDiff = [
            [shapePoints[0][0] - handlerPosition.x, 0],
            [shapePoints[0][1] - handlerPosition.x, 1],
            [shapePoints[0][2] - handlerPosition.x, 2]
          ]

          const pointYDiff = [
            [shapePoints[1][0] - handlerPosition.y, 0],
            [shapePoints[1][1] - handlerPosition.y, 1],
            [shapePoints[1][2] - handlerPosition.y, 2]
          ]

          const getClosestX = getClosestXFunc(shapePoints)
          const getClosestY = getClosestYFunc(shapePoints)

          pointXDiff.forEach(getClosestX)
          pointYDiff.forEach(getClosestY)
        })
      }

      if (closestX.points !== null) {
        if (closestX.pointIndex == 0) {
          measuringLineX[0][0] = closestX.points[0][0]
          measuringLineX[1][0] = closestX.points[0][0]
        } else if (closestX.pointIndex === 1) {
          measuringLineX[0][0] = closestX.points[0][1]
          measuringLineX[1][0] = closestX.points[0][1]
        } else { // closestX.pointIndex === 2
          measuringLineX[0][0] = closestX.points[0][2]
          measuringLineX[1][0] = closestX.points[0][2]
        }

        if (closestX.points[1][0] > dragingShapePoints[1][0]) {
          measuringLineX[0][1] = dragingShapePoints[1][0] + closestY.correct
          measuringLineX[1][1] = closestX.points[1][2]
        } else {
          measuringLineX[0][1] = closestX.points[1][0]
          measuringLineX[1][1] = dragingShapePoints[1][2] + closestY.correct
        }

        referenceShape[0] = Common.pointsToSize(closestX.points)
      }

      if (closestY.points !== null) {
        if (closestY.pointIndex == 0) {
          measuringLineY[0][1] = closestY.points[1][0]
          measuringLineY[1][1] = closestY.points[1][0]
        } else if (closestY.pointIndex === 1) {
          measuringLineY[0][1] = closestY.points[1][1]
          measuringLineY[1][1] = closestY.points[1][1]
        } else { // closestY.pointIndex === 2
          measuringLineY[0][1] = closestY.points[1][2]
          measuringLineY[1][1] = closestY.points[1][2]
        }

        if (closestY.points[0][0] > dragingShapePoints[0][0]) {
          measuringLineY[0][0] = dragingShapePoints[0][0] + closestX.correct
          measuringLineY[1][0] = closestY.points[0][2]
        } else {
          measuringLineY[0][0] = closestY.points[0][0]
          measuringLineY[1][0] = dragingShapePoints[0][2] + closestX.correct
        }

        referenceShape[1] = Common.pointsToSize(closestY.points)
      }

      this.measuringLine = [
        measuringLineX,
        measuringLineY
      ]

      this.dragingShapeId = shapeId
      this.referenceShape = referenceShape

      switch(handler) {
        case 'move':
          this.corrected.x = closestX.correct
          this.corrected.y = closestY.correct
          break
        case 'top-left':
          this.corrected.x = closestX.correct
          this.corrected.y = closestY.correct
          this.corrected.width = closestX.correct * -1
          this.corrected.height = closestY.correct * -1
          break
        case 'top-middle':
          this.corrected.y = closestY.correct
          this.corrected.height = closestY.correct * -1
          break
        case 'top-right':
          this.corrected.y = closestY.correct
          this.corrected.width = closestX.correct
          this.corrected.height = closestY.correct * -1
          break
        case 'bottom-left':
          this.corrected.x = closestX.correct
          this.corrected.width = closestX.correct * -1
          this.corrected.height = closestY.correct
          break
        case 'bottom-middle':
          this.corrected.height = closestY.correct
          break
        case 'bottom-right':
          this.corrected.width = closestX.correct
          this.corrected.height = closestY.correct
          break
        case 'middle-left':
          this.corrected.x = closestX.correct
          this.corrected.width = closestX.correct * -1
          break
        case 'middle-right':
          this.corrected.width = closestX.correct
          break
      }
    },

    handleChangedShape(shapeId, size) {
      this.shapeList.some(shape => {
        if (shape.id === shapeId) {
          Object.assign(shape, size)
          return true
        }
      })

      this.dragingShapeId = null
      this.resetCorrectedValue()
      this.referenceShape = resetReferenceShape()
    },

    // 重制修正值
    resetCorrectedValue() {
      this.measuringLine = [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ]
      this.corrected = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }
  }
}