import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import config from './../../../config';

// Thunk để gọi API và lấy bài viết của người dùng
export const fetchUserPosts = createAsyncThunk(
  'newPost/fetchUserPosts',
  async (_, { rejectWithValue }) => {
    const targetUserId = localStorage.getItem('_id');
    try {
      const response = await fetch(`${config.API_HOST}/api/post/getUserPost/${targetUserId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      if (data.success) {
        // Transform likes data before returning
        const postsWithLikeStatus = data.posts.map(post => ({
          ...post,
          isLiked: post.likes?.some(like => like._id === targetUserId),
          likesCount: post.likes?.length || 0
        }));
        return { posts: postsWithLikeStatus };
      } else {
        return rejectWithValue(data.message || 'Failed to fetch posts');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk để fetch chi tiết bài viết
export const fetchGetPost = createAsyncThunk(
  'newPost/fetchGetPost',
  async ({ postId }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/post/getPost/${postId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post details');
      }

      const data = await response.json();

      if (data.success) {
        const { comments, totalComments } = getState().comments;
        const currentUserId = localStorage.getItem('_id');

        // Process likes data
        const postWithLikeStatus = {
          ...data.post,
          comments,
          totalComments,
          isLiked: data.post.likes?.some(like => like._id === currentUserId),
          likesCount: data.post.likes?.length || 0,
          // Store the full likes array for detailed processing if needed
          likesDetails: data.post.likes || []
        };

        return postWithLikeStatus;
      } else {
        return rejectWithValue(data.message || 'Failed to fetch post details');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk để xử lý like/unlike
export const toggleLike = createAsyncThunk(
  'newPost/toggleLike',
  async ({ postId }, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/post/${postId}/like`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      if (data.success) {
        const currentUserId = localStorage.getItem('_id');
        return {
          postId,
          likes: data.post.likes,
          isLiked: data.post.likes.some(like => like._id === currentUserId),
          likesCount: data.post.likes.length
        };
      } else {
        return rejectWithValue(data.message || 'Failed to update like');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const newPostSlice = createSlice({
  name: 'newPost',
  initialState: {
    posts: [],
    selectedPost: null,
    showPreviewModal: false,
    loading: false,
    error: null,
  },
  reducers: {
    setShowPreviewModal(state, action) {
      state.showPreviewModal = action.payload;
    },
    setSelectedPost(state, action) {
      state.selectedPost = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch posts';
      })
      .addCase(fetchGetPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGetPost.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPost = action.payload;
        state.showPreviewModal = true;
      })
      .addCase(fetchGetPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch post details';
        state.showPreviewModal = false;
      })
      // Handle toggleLike action
      .addCase(toggleLike.fulfilled, (state, action) => {
        // Update like status in posts array
        state.posts = state.posts.map(post =>
          post._id === action.payload.postId
            ? {
              ...post,
              likes: action.payload.likes,
              isLiked: action.payload.isLiked,
              likesCount: action.payload.likesCount
            }
            : post
        );

        // Update like status in selectedPost if it exists
        if (state.selectedPost && state.selectedPost._id === action.payload.postId) {
          state.selectedPost = {
            ...state.selectedPost,
            likes: action.payload.likes,
            isLiked: action.payload.isLiked,
            likesCount: action.payload.likesCount
          };
        }
      });
  },
});

export const { setShowPreviewModal, setSelectedPost, clearError } = newPostSlice.actions;
export default newPostSlice.reducer;