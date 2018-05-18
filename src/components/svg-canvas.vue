<template>
  <svg viewBox="0 0 1000 1000" width="800" height="800" ref="svg">
    <rect width="100%" height="100%" fill="none" stroke="#000" x="0" y="0" />
    <!-- <rectangle
      v-for="(props, i) in shapeList"
      :key="props.id"
      :id="props.id"
      :points.sync="props.points"
      :getViewportRef="getViewportRef"
      :correctX="dragingShape === props.id ? correctX : 0"
      :correctY="dragingShape === props.id ? correctY : 0"
      @draging="handleDragingShape"
      @update:points="handleDragEnd"
    /> -->

    <rectangle
      v-for="(shape, i) in shapeList"
      :key="shape.id"
      :id="shape.id"
      :size="{x:shape.x, y:shape.y, width:shape.width, height:shape.height}"
      :corrected=""
      :getViewportRef="getViewportRef"
      @changing=""
      @changed="handleChangedShape"
    />

    <line
      :x1="measuringLine[0][0][0]"
      :y1="measuringLine[0][0][1]"
      :x2="measuringLine[0][1][0]"
      :y2="measuringLine[0][1][1]"
      stroke="#f00"
      stroke-width="2"
    />

    <line
      :x1="measuringLine[1][0][0]"
      :y1="measuringLine[1][0][1]"
      :x2="measuringLine[1][1][0]"
      :y2="measuringLine[1][1][1]"
      stroke="#f00"
      stroke-width="2"
    />
  </svg>
</template>

<script>
import Common from '@/common'
import Utils from '@/utils'
import rectangle from './rectangle'

// 吸附阈值
const DISTANCE_THRESHOLD = 8

const RectList = [
  {x: 124, y: 125, width: 100, height: 100, rotate: 0},
  {x: 723, y: 265, width: 200, height: 130, rotate: 0},
  {x: 482, y: 422, width: 130, height: 200, rotate: 0},
  {x: 208, y: 402, width: 231, height: 503, rotate: 0}
]

export default {
  components: {
    rectangle
  },
  data() {
    const ID_TEMPLATE = +new Date()

    const shapeList = RectList.map((rect, i) => {
      return {
        id: ID_TEMPLATE + i,
        ...rect
      }
    })

    return {
      shapeList,

      dragingShapeId: null, // 拖拽中的图形
      measuringLine: [      // 吸附参考线
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ],
      corrected: { // 修正值
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }
  },
  methods: {
    getViewportRef() {
      return this.$refs.svg
    },

    /**
     * 形状处于变化时的回调（用于计算吸附校正）
     * @param  {String} shapeId       形状编号
     * @param  {String} action        触发变化时进行的动作，有3种值：move(位移), resize(修改尺寸), rotate(旋转)
     * @param  {String} handler       触发变化的手柄，有10种值：
     *                                 move (位移), rotate (旋转),
     *                                 top-left (左上), top-middle (中上), top-right (右上),
     *                                 bottom-left (左下), bottom-middle (中下), bottom-right (右下),
     *                                 middle-left (中左), meddle-right (中右)
     * @param  {Array}  currentPoints 变化时的关键点矩阵，格式为：
     *                                 [
     *                                   [xMin, xMid, xMax],
     *                                   [yMin, yMid, yMax]
     *                                 ]
     */
    handleChangingShape(shapeId, action, handler, currentPoints) {
    },

    // 计算吸附修正
    // handleDragingShape(shapeId, dragingShapePoints) {
    //   const measuringLineX = [[0, 0], [0, 0]]
    //   const measuringLineY = [[0, 0], [0, 0]]

    //   // 拖拽中的元素与参考元素的x轴关系值
    //   let closestX = {
    //     points: null,       // 参考对象的关键点集合
    //     distance: Infinity, // 与参考对象的x轴关键点的差值绝对值的最小值
    //     pointIndex: 0,      // 参考的关键点索引 0: xMin, 1: xMid, 2: xMax
    //     correct: 0          // x轴修正值
    //   }

    //   let closestY = {
    //     points: null,
    //     distance: Infinity,
    //     pointIndex: 0, 
    //     correct: 0
    //   }

    //   this.shapeList.forEach(shape => {
    //     if (shape.id === shapeId) {
    //       return
    //     }

    //     const pointXDiff = [
    //       [shape.points[0][0] - dragingShapePoints[0][0], 0],
    //       [shape.points[0][0] - dragingShapePoints[0][1], 0],
    //       [shape.points[0][0] - dragingShapePoints[0][2], 0],
    //       [shape.points[0][1] - dragingShapePoints[0][0], 1],
    //       [shape.points[0][1] - dragingShapePoints[0][1], 1],
    //       [shape.points[0][1] - dragingShapePoints[0][2], 1],
    //       [shape.points[0][2] - dragingShapePoints[0][0], 2],
    //       [shape.points[0][2] - dragingShapePoints[0][1], 2],
    //       [shape.points[0][2] - dragingShapePoints[0][2], 2]
    //     ]

    //     const pointYDiff = [
    //       [shape.points[1][0] - dragingShapePoints[1][0], 0],
    //       [shape.points[1][0] - dragingShapePoints[1][1], 0],
    //       [shape.points[1][0] - dragingShapePoints[1][2], 0],
    //       [shape.points[1][1] - dragingShapePoints[1][0], 1],
    //       [shape.points[1][1] - dragingShapePoints[1][1], 1],
    //       [shape.points[1][1] - dragingShapePoints[1][2], 1],
    //       [shape.points[1][2] - dragingShapePoints[1][0], 2],
    //       [shape.points[1][2] - dragingShapePoints[1][1], 2],
    //       [shape.points[1][2] - dragingShapePoints[1][2], 2]
    //     ]

    //     pointXDiff.forEach(diff => {
    //       const distance = Math.abs(diff[0])
    //       if (distance < closestX.distance && (distance < DISTANCE_THRESHOLD)) {
    //         closestX = {
    //           distance,
    //           pointIndex: diff[1],
    //           points: shape.points,
    //           correct: diff[0]
    //         }
    //       }
    //     })

    //     pointYDiff.forEach(diff => {
    //       const distance = Math.abs(diff[0])
    //       if (distance < closestY.distance && (distance < DISTANCE_THRESHOLD)) {
    //         closestY = {
    //           distance,
    //           pointIndex: diff[1],
    //           points: shape.points,
    //           correct: diff[0]
    //         }
    //       }
    //     })
    //   })

    //   if (closestX.points !== null) {
    //     if (closestX.pointIndex == 0) {
    //       measuringLineX[0][0] = closestX.points[0][0]
    //       measuringLineX[1][0] = closestX.points[0][0]
    //     } else if (closestX.pointIndex === 1) {
    //       measuringLineX[0][0] = closestX.points[0][1]
    //       measuringLineX[1][0] = closestX.points[0][1]
    //     } else { // closestX.pointIndex === 2
    //       measuringLineX[0][0] = closestX.points[0][2]
    //       measuringLineX[1][0] = closestX.points[0][2]
    //     }

    //     if (closestX.points[1][0] > dragingShapePoints[1][0]) {
    //       measuringLineX[0][1] = dragingShapePoints[1][0] + closestY.correct
    //       measuringLineX[1][1] = closestX.points[1][2]
    //     } else {
    //       measuringLineX[0][1] = closestX.points[1][0]
    //       measuringLineX[1][1] = dragingShapePoints[1][2] + closestY.correct
    //     }
    //   }

    //   if (closestY.points !== null) {
    //     if (closestY.pointIndex == 0) {
    //       measuringLineY[0][1] = closestY.points[1][0]
    //       measuringLineY[1][1] = closestY.points[1][0]
    //     } else if (closestY.pointIndex === 1) {
    //       measuringLineY[0][1] = closestY.points[1][1]
    //       measuringLineY[1][1] = closestY.points[1][1]
    //     } else { // closestY.pointIndex === 2
    //       measuringLineY[0][1] = closestY.points[1][2]
    //       measuringLineY[1][1] = closestY.points[1][2]
    //     }

    //     if (closestY.points[0][0] > dragingShapePoints[0][0]) {
    //       measuringLineY[0][0] = dragingShapePoints[0][0] + closestX.correct
    //       measuringLineY[1][0] = closestY.points[0][2]
    //     } else {
    //       measuringLineY[0][0] = closestY.points[0][0]
    //       measuringLineY[1][0] = dragingShapePoints[0][2] + closestX.correct
    //     }
    //   }

    //   this.measuringLine = [
    //     measuringLineX,
    //     measuringLineY
    //   ]

    //   this.dragingShape = shapeId
    //   this.correctX = closestX.correct
    //   this.correctY = closestY.correct
    // },

    handleChangedShape(shapeId, size) {
      const dragingShape = this.dragingShape

      this.shapeList.some(shape => {
        if (shape.id === dragingShape) {
          Object.assign(shape, size)
          return true
        }
      })

      this.dragingShapeId = null
      this.resetCorrectedValue()
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

    // handleDragEnd() {
    //   this.dragingShape = null
    //   this.correctX = 0
    //   this.correctY = 0

    //   this.measuringLine = [
    //     [[0, 0], [0, 0]],
    //     [[0, 0], [0, 0]]
    //   ]
    // }
  }
}
</script>