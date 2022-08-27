export default function getObjectFitContainSize(canvas: HTMLCanvasElement) {
  const ratio = canvas.width / canvas.height;
  const bounds = canvas.getBoundingClientRect();
  let width = bounds.height * ratio;
  let { height } = bounds;
  if (width > bounds.width) {
    width = bounds.width;
    height = bounds.width / ratio;
  }
  return { width, height };
}
