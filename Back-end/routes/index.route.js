import express from 'express';

import UserRoute from './user.route.js';
import MessageRoute from './message.route.js';
import PostRoute from './post.route.js';
import CommentRoute from './comment.route.js';
import NotificationRoute from './notification.route.js';

const router = express.Router();
router.use('/user', UserRoute);
router.use('/message', MessageRoute);
router.use('/post', PostRoute);
router.use('/comment', CommentRoute);
router.use('/notification', NotificationRoute);
export default router;