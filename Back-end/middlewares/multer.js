import multer from 'multer';

const upload = multer({
    //lưu ảnh vào ram trước khi lưu vào cloudinary
    storage: multer.memoryStorage(),
})
export default upload;