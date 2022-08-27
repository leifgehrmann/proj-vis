export default function loadImage(imgElement: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    imgElement.addEventListener('load', () => {
      resolve();
    });
    if (imgElement.complete) {
      resolve();
    }
  });
}
