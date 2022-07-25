export function loadImage (imgElement: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    imgElement.onload = () => {
      resolve()
    }
    if (imgElement.complete) {
      resolve()
    }
  })
}
