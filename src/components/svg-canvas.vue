<template>
  <svg viewBox="0 0 1000 1000" width="500" height="500" ref="svg">
    <rect width="100%" height="100%" fill="none" stroke="#000" x="0" y="0" />
    <rectangle
      v-for="(props, i) in shapeList"
      :key="props.id"
      :id="props.id"
      :points.sync="props.points"
      :getViewportRef="getViewportRef"
      @draging="handleDragingShape"
      @update:points="handleDragEnd"
    />

    <line
      :x1="measuringLine[0][0][0]"
      :y1="measuringLine[0][0][1]"
      :x2="measuringLine[0][1][0]"
      :y2="measuringLine[0][1][1]"
      stroke="#f00"
    />

    <line
      :x1="measuringLine[1][0][0]"
      :y1="measuringLine[1][0][1]"
      :x2="measuringLine[1][1][0]"
      :y2="measuringLine[1][1][1]"
      stroke="#f00"
    />
  </svg>
</template>

<script>
import common from '../common'
import rectangle from './rectangle'

const DISTANCE_THRESHOLD = 5

const RectList = [{
  x: 124,
  y: 125,
  width: 100,
  height: 100
}, {
  x: 723,
  y: 265,
  width: 200,
  height: 130
}, {
  x: 482,
  y: 422,
  width: 130,
  height: 200
}, {
  x: 288,
  y: 722,
  width: 132,
  height: 203
}]

const getPoints = rect => {
  const xMin = rect.x
  const xMid = rect.x + rect.width / 2
  const xMax = rect.x + rect.width
  const yMin = rect.y
  const yMid = rect.y + rect.height / 2
  const yMax = rect.y + rect.height

  return [
    [xMin, xMid, xMax],
    [yMin, yMid, yMax]
  ]
}

export default {
  components: {
    rectangle
  },
  data() {
    const ID_TEMPLATE = +new Date()

    const shapeList = RectList.map((rect, i) => {
      return {
        id: ID_TEMPLATE + i,
        points: getPoints(rect),
        ...rect
      }
    })

    return {
      shapeList,
      measuringLine: [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ]
    }
  },
  methods: {
    getViewportRef() {
      return this.$refs.svg
    },
    handleDragingShape(shapeId, points) {
      const measuringLineX = [[0, 0], [0, 0]]
      const measuringLineY = [[0, 0], [0, 0]]

      const closestX = {
        points: null,
        distance: Infinity,
        pointIndex: []
      }

      const closestY = {
        points: null,
        distance: Infinity,
        pointIndex: []
      }

      this.shapeList.forEach(shape => {
        if (shape.id === shapeId) {
          return
        }

        const pointXDiff = [
          [Math.abs(shape.points[0][0] - points[0][0]), 0],
          [Math.abs(shape.points[0][0] - points[0][1]), 0],
          [Math.abs(shape.points[0][0] - points[0][2]), 0],
          [Math.abs(shape.points[0][1] - points[0][0]), 1],
          [Math.abs(shape.points[0][1] - points[0][1]), 1],
          [Math.abs(shape.points[0][1] - points[0][2]), 1],
          [Math.abs(shape.points[0][2] - points[0][0]), 2],
          [Math.abs(shape.points[0][2] - points[0][1]), 2],
          [Math.abs(shape.points[0][2] - points[0][2]), 2]
        ]

        const pointYDiff = [
          [Math.abs(shape.points[1][0] - points[1][0]), 0],
          [Math.abs(shape.points[1][0] - points[1][1]), 0],
          [Math.abs(shape.points[1][0] - points[1][2]), 0],
          [Math.abs(shape.points[1][1] - points[1][0]), 1],
          [Math.abs(shape.points[1][1] - points[1][1]), 1],
          [Math.abs(shape.points[1][1] - points[1][2]), 1],
          [Math.abs(shape.points[1][2] - points[1][0]), 2],
          [Math.abs(shape.points[1][2] - points[1][1]), 2],
          [Math.abs(shape.points[1][2] - points[1][2]), 2]
        ]

        pointXDiff.forEach(diff => {
          if (diff[0] < closestX.distance) {
            closestX.distance = diff[0]
            closestX.pointIndex = diff[1]
            closestX.points = shape.points
          }
        })

        pointYDiff.forEach(diff => {
          if (diff[0] < closestY.distance) {
            closestY.distance = diff[0]
            closestY.pointIndex = diff[1]
            closestY.points = shape.points
          }
        })
      })

      if (closestX.distance < DISTANCE_THRESHOLD) {
        if (closestX.pointIndex == 0) {
          measuringLineX[0][0] = closestX.points[0][0]
          measuringLineX[1][0] = closestX.points[0][0]
        } else if (closestX.pointIndex === 1) {
          measuringLineX[0][0] = closestX.points[0][1]
          measuringLineX[1][0] = closestX.points[0][1]
        } else {
          measuringLineX[0][0] = closestX.points[0][2]
          measuringLineX[1][0] = closestX.points[0][2]
        }

        if (closestX.points[1][0] > points[1][0]) {
          measuringLineX[0][1] = points[1][0]
          measuringLineX[1][1] = closestX.points[1][2]
        } else {
          measuringLineX[0][1] = closestX.points[1][0]
          measuringLineX[1][1] = points[1][2]
        }
      }

      if (closestY.distance < DISTANCE_THRESHOLD) {
        if (closestY.pointIndex == 0) {
          measuringLineY[0][1] = closestY.points[1][0]
          measuringLineY[1][1] = closestY.points[1][0]
        } else if (closestY.pointIndex === 1) {
          measuringLineY[0][1] = closestY.points[1][1]
          measuringLineY[1][1] = closestY.points[1][1]
        } else {
          measuringLineY[0][1] = closestY.points[1][2]
          measuringLineY[1][1] = closestY.points[1][2]
        }

        if (closestY.points[0][0] > points[0][0]) {
          measuringLineY[0][0] = points[0][0]
          measuringLineY[1][0] = closestY.points[0][2]
        } else {
          measuringLineY[0][0] = closestY.points[0][0]
          measuringLineY[1][0] = points[0][2]
        }
      }

      this.measuringLine = [
        measuringLineX,
        measuringLineY
      ]
    },
    handleDragEnd() {
      this.measuringLine = [
        [[0, 0], [0, 0]],
        [[0, 0], [0, 0]]
      ]
    }
  }
}
</script>