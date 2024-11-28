// utils/cropImage.js
export const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Convert canvas to file
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'croppedImage.png', { type: 'image/png' });
          resolve(file);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, 'image/png');
    };
    image.onerror = (error) => {
      reject(new Error('Error loading image: ' + error));
    };
  });
};
