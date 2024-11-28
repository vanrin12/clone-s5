import User from '../models/user.model.js';
import Post from '../models/post.model.js';

export const isAccessProfile = async (req, res, next) => {
    try {
        const userId = req.id;
        const personId = req.params.id || req.body.id;
        const [user, person] = await Promise.all([
            User.findById(userId),
            User.findById(personId),
        ]);
        if (!person || !user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }
        if (personId !== userId && (!user.following.includes(personId) || !user.followers.includes(personId)) && person.private) {
            const personSelect = {
                _id: person._id,
                username: person.username,
                fullname: person.fullname,
                profilePicture: person.profilePicture,
            };
            return res.status(403).json({
                success: false,
                message: "Trang cá nhân riêng tư, chưa theo dõi hoặc được theo dõi nên không có quyền truy cập",
                personSelect,
            });
        }
        console.log('Có quyền truy cập');
        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi không xác định",
        });
    }
};
export const isAccessPost = async (req, res, next) => {
    try {
        const userId = req.id;
        const postId = req.params.postId;
        const user = await User.findById(userId);
        const post = await Post.findById(postId).populate('author');

        if (!user || !post) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng hoặc bài viết"
            });
        }

        const author = post.author;

        if (author.private && author._id.toString() !== userId && !author.followers.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: "Bài viết thuộc tài khoản riêng tư và bạn không có quyền truy cập"
            });
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Lỗi không xác định",
        });
    }
};
