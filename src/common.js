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

const pointsToSize = points => ({
  x: points[0][0],
  y: points[1][0],
  width: points[0][2] - points[0][0],
  height: points[1][2] - points[1][0],
})

/**
 * 获取鼠标位置在svg元素中的坐标
 * @param   {SVGElement}  SVGElement  SVG元素
 * @param   {Event}       e           Event
 * @return  {Object}                  鼠标指针在SVG中的坐标（xy结构）
 */
const getPositionInSvg = (SVGElement, e) => {
  const point = SVGElement.createSVGPoint()

  point.x = e.clientX
  point.y = e.clientY

  const position = point.matrixTransform(SVGElement.getScreenCTM().inverse())

  return {
    x: position.x,
    y: position.y,
  }
}

/**
 * 角度转弧度(通常用于js的计算正弦余弦的方法)
 * @param   {Number}  degree  角度
 * @return  {Number}          弧度
 */
const degreeToRadian = degree => 2 * Math.PI / 360 * degree

/**
 * 计算根据圆心旋转后的点的坐标
 * @param   {Object}  point   旋转前的点坐标
 * @param   {Object}  center  旋转中心
 * @param   {Int}     rotate  旋转的角度
 * @return  {Object}          旋转后的坐标
 */
const getRotatedPoint = (point, center, rotate) => {
  /**
   * 旋转公式：
   *  点a(x, y)
   *  旋转中心c(x, y)
   *  旋转后点n(x, y)
   *  旋转角度θ
   * nx = cosθ * (ax - cx) - sinθ * (ay - cy) + cx
   * ny = sinθ * (ax - cx) + cosθ * (ay - cy) + cy
   */
  return {
    x: (point.x - center.x) * Math.cos(degreeToRadian(rotate)) - (point.y - center.y) * Math.sin(degreeToRadian(rotate)) + center.x,
    y: (point.x - center.x) * Math.sin(degreeToRadian(rotate)) + (point.y - center.y) * Math.cos(degreeToRadian(rotate)) + center.y
  }
}

const absoluteZoom = (num, scaling) => (num / scaling * 100).toFixed(2)

export default {
  sizeToPoints,
  pointsToSize,
  getPositionInSvg,
  degreeToRadian,
  getRotatedPoint,
  absoluteZoom
}