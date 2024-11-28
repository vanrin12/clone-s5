import express from 'express';
import { addComment, deleteComment, editComment, getComments, replyComment } from '../controllers/comment.controller.js';
import isAuth from '../middlewares/isAuth.middleware.js';
import { isIdObj } from '../middlewares/isIdObj.js';
const router = express.Router();
router.get('/:postId', isAuth, isIdObj('postId'), getComments); // lấy ra danh sách comment (lưu ý có truyền thêm queryparameter)
router.post('/:postId', isAuth, isIdObj('postId'), addComment); // viết bình luận
router.post('/reply/:postId/:commentId', isAuth, isIdObj('postId', 'commentId'), replyComment); // trả lời bình luận
router.delete('/:commentId', isAuth, isIdObj('commentId'), deleteComment);
router.patch('/:commentId', isAuth, isIdObj('commentId'), editComment);
export default router;