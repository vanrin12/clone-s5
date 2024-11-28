import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import config from './../../../config';

// Thực hiện gọi API để lấy danh sách bài viết của người dùng
export const fetchPosts = createAsyncThunk(
  'comments/fetchPosts',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/post/getUserPost/${userId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();

      if (data.success && data.posts) {
        return data.posts;
      } else {
        return rejectWithValue(data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thực hiện gọi API để lấy danh sách bình luận
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async ({ postId, sortType = 'intelligent' }, { rejectWithValue }) => {
    try {
      // Validate sortType
      const validSortTypes = ['intelligent', 'newest', 'mostLiked'];
      if (!validSortTypes.includes(sortType)) {
        return rejectWithValue('Invalid sort type');
      }

      const response = await fetch(
        `${config.API_HOST}/api/comment/${postId}?sortType=${sortType}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();

      if (data && data.comments) {
        // Process comments with proper structure
        let processedComments = data.comments.map(comment => {
          return {
            ...comment,
            author: {
              _id: comment.author._id,
              username: comment.author.username,
              fullname: comment.author.fullname,
              profilePicture: comment.author.profilePicture,
              reputation: comment.author.reputation
            },
            replies: Array.isArray(comment.replies) ? comment.replies.map(reply => {
              return {
                ...reply,
                author: {
                  _id: reply.author._id,
                  username: reply.author.username,
                  fullname: reply.author.fullname,
                  profilePicture: reply.author.profilePicture,
                  reputation: reply.author.reputation
                }
              };
            }) : []
          };
        });

        // Apply sorting based on sortType
        if (sortType === 'newest') {
          // Sort main comments by date
          processedComments.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          // Sort replies in each comment
          processedComments = processedComments.map(comment => {
            const sortedReplies = [...comment.replies].sort((a, b) => {
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
            return { ...comment, replies: sortedReplies };
          });
        }

        if (sortType === 'mostLiked') {
          // Sort main comments by likes
          processedComments.sort((a, b) => {
            const aLikes = a.likes ? a.likes.length : 0;
            const bLikes = b.likes ? b.likes.length : 0;
            return bLikes - aLikes;
          });

          // Sort replies in each comment
          processedComments = processedComments.map(comment => {
            const sortedReplies = [...comment.replies].sort((a, b) => {
              const aLikes = a.likes ? a.likes.length : 0;
              const bLikes = b.likes ? b.likes.length : 0;
              return bLikes - aLikes;
            });
            return { ...comment, replies: sortedReplies };
          });
        }

        if (sortType === 'intelligent') {
          // Sort replies using intelligent algorithm
          processedComments = processedComments.map(comment => {
            const sortedReplies = [...comment.replies].sort((a, b) => {
              const aScore = (a.likes ? a.likes.length : 0) +
                (new Date(a.createdAt).getTime() / 1000000);
              const bScore = (b.likes ? b.likes.length : 0) +
                (new Date(b.createdAt).getTime() / 1000000);
              return bScore - aScore;
            });
            return { ...comment, replies: sortedReplies };
          });
        }

        return {
          comments: processedComments,
          totalComments: data.totalComments,
          sortType: data.sortType,
          postId,
        };
      } else {
        return rejectWithValue(data.message || 'Invalid response format');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thực hiện gọi API để thêm bình luận
export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ postId, text }, { rejectWithValue }) => {
    if (!text || text.trim().length === 0) {
      return rejectWithValue('Comment cannot be empty');
    }

    try {
      const response = await fetch(
        `${config.API_HOST}/api/comment/${postId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();

      // Sửa lại check theo response của BE
      if (data.comment) {
        return {
          comment: {
            ...data.comment,
            replies: [], // Vẫn giữ replies array cho FE render
          },
          postId,
        };
      } else {
        return rejectWithValue(data.message || 'Failed to add comment');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thêm thunk mới cho reply comment
export const replyComment = createAsyncThunk(
  'comments/replyComment',
  async ({ postId, commentId, text }, { rejectWithValue }) => {
    if (!text || text.trim().length === 0) {
      return rejectWithValue('Reply cannot be empty');
    }

    try {
      const response = await fetch(
        `${config.API_HOST}/api/comment/reply/${postId}/${commentId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reply to comment');
      }

      const data = await response.json();

      if (data.reply) {
        return {
          reply: {
            ...data.reply,
            parentId: commentId,
          },
          parentId: commentId,
          postId,
        };
      } else {
        return rejectWithValue(data.message || 'Failed to reply to comment');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    comments: [],
    posts: [],
    totalComments: 0,
    currentSortType: 'intelligent',
    loading: false,
    error: null,
    currentCommentId: null,
  },
  reducers: {
    updateSortType: (state, action) => {
      state.currentSortType = action.payload;
    },
    resetComments: (state) => {
      state.comments = [];
      state.totalComments = 0;
      state.error = null;
    },
    addOptimisticReply: (state, action) => {
      const { parentId, reply } = action.payload;
      const updateCommentReplies = (comments) => {
        return comments.map(comment => {
          if (comment._id === parentId) {
            // Kiểm tra xem reply đã tồn tại chưa
            const replyExists = comment.replies?.some(r =>
              r._id === reply._id || (r._id.startsWith('temp-') && r.text === reply.text)
            );

            if (!replyExists) {
              return {
                ...comment,
                replies: [...(comment.replies || []), reply]
              };
            }
            return comment;
          }
          if (comment.replies?.length > 0) {
            return {
              ...comment,
              replies: updateCommentReplies(comment.replies)
            };
          }
          return comment;
        });
      };
      state.comments = updateCommentReplies(state.comments);
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý fetchPosts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
        state.error = null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch posts';
      })

      // Xử lý fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload.comments;
        state.totalComments = action.payload.totalComments;
        state.currentSortType = action.payload.sortType;
        state.error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch comments';
      })

      // Xử lý addComment
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.comment) {
          // Nếu là comment gốc (không có parentId)
          if (!action.payload.comment.parentId) {
            state.comments.unshift(action.payload.comment);
          } else {
            // Nếu là reply, tìm comment cha và thêm vào mảng replies
            const parentComment = state.comments.find(
              comment => comment._id === action.payload.comment.parentId
            );
            if (parentComment) {
              if (!parentComment.replies) {
                parentComment.replies = [];
              }
              parentComment.replies.unshift(action.payload.comment);
            }
          }
          state.totalComments += 1;
        }
        state.error = null;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add comment';
      })
      // Xử lý replyComment trong extraReducers
      .addCase(replyComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
    builder.addCase(replyComment.fulfilled, (state, action) => {
      state.loading = false;
      const { reply, parentId } = action.payload;

      const updateCommentReplies = (comments) => {
        return comments.map(comment => {
          if (comment._id === parentId) {
            // Lọc ra các replies không phải temporary của reply hiện tại
            const filteredReplies = comment.replies?.filter(r =>
              !(r._id.startsWith('temp-') && r.text === reply.text)
            ) || [];

            // Kiểm tra xem reply đã tồn tại chưa
            const replyExists = filteredReplies.some(r => r._id === reply._id);

            if (!replyExists) {
              filteredReplies.push({ ...reply, parentId });
            }

            return {
              ...comment,
              replies: filteredReplies
            };
          }
          if (comment.replies?.length > 0) {
            return {
              ...comment,
              replies: updateCommentReplies(comment.replies)
            };
          }
          return comment;
        });
      };

      state.comments = updateCommentReplies(state.comments);
      state.error = null;
    })
      .addCase(replyComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to reply to comment';
      })
  },
});

export const { updateSortType, resetComments } = commentsSlice.actions;
export default commentsSlice.reducer;