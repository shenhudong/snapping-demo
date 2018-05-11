<template>
  <svg viewBox="0 0 1000 1000" width="500" height="500" ref="svg">
    <rectangle
      v-for="(props, i) in shapeList"
      :key="props.id"
      :id="props.id"
      :points.sync="props.points"
      :getViewportRef="getViewportRef"
      @draging="handleDragingShape"
    />
  </svg>
</template>

<script>
import common from '../common'
import rectangle from './rectangle'

const RectList = [{
  x: 5,
  y: 5,
  width: 100,
  height: 100
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
      measuringLine: [0, 0]
    }
  },
  methods: {
    getViewportRef() {
      return this.$refs.svg
    },
    handleDragingShape(shapeId, points) {
      console.log(points)
    }
  }
}
</script>