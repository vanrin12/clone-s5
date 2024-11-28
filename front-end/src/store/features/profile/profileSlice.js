import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import config from './../../../config';


// Helper function để validate ObjectId
const isValidObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

// Async thunk cho việc fetch profile data
export const fetchProfileData = createAsyncThunk(
  'profile/fetchProfileData',
  async ({ userId, myUserId }, { rejectWithValue }) => {
    try {
      const youUserId = userId || myUserId;

      if (!isValidObjectId(youUserId)) {
        throw new Error('Invalid User ID');
      }

      if (!youUserId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`${config.API_HOST}/api/user/${youUserId}/profile`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message);
      }

      const data = await response.json();
      if (data.success) {
        return {
          user: data.user,
          followers: data.user.followers || [],
          following: data.user.following || [],
          posts: data.user.posts || [],
          featuredNote: data.user.featuredNote?.content || data.user.featuredNote || '',
          isFollowing: data.user.followers.includes(myUserId),
        };
      } else {
        return rejectWithValue(data.message || 'Failed to fetch profile data.');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thêm async thunk mới cho việc cập nhật profile
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ bio, gender }, { rejectWithValue, dispatch }) => {
    try {
      // Map giá trị gender từ UI sang giá trị API
      const mappedGender = gender === 'Nữ' ? 'female' : 'male';

      const response = await fetch(`${config.API_HOST}/api/user/profile/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio, gender: mappedGender }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        return {
          ...data.user,
          // Map giá trị gender từ API sang giá trị UI
          gender: data.user.gender === 'female' ? 'Nữ' : 'Nam'
        };
      } else {
        return rejectWithValue(data.message || 'Failed to update profile.');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk cho việc upload ảnh đại diện
export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadProfilePicture',
  async ({ file, isOwnProfile, userId }, { rejectWithValue, dispatch }) => {
    if (!isOwnProfile) return rejectWithValue('Not authorized to upload profile picture.');

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await fetch(`${config.API_HOST}/api/user/profile/edit`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        // Sau khi upload thành công, fetch lại toàn bộ profile data
        const myUserId = localStorage.getItem('_id');
        dispatch(fetchProfileData({ myUserId }));
        return data.user.profilePicture;
      } else {
        return rejectWithValue(data.message || 'Failed to upload profile picture.');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk cho việc xóa ảnh đại diện
export const removeProfilePicture = createAsyncThunk(
  'profile/removeProfilePicture',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/deleteAvatar`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        const profileResponse = await fetch(`${config.API_HOST}/api/user/${userId}/profile`, {
          method: 'GET',
          credentials: 'include',
        });

        const profileData = await profileResponse.json();
        if (profileData.success) {
          return profileData.user.profilePicture;
        } else {
          return rejectWithValue(profileData.message || 'Failed to remove profile picture.');
        }
      } else {
        return rejectWithValue(data.message || 'Failed to remove profile picture.');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk cho việc gửi OTP
export const sendOtp = createAsyncThunk(
  'profile/sendOtp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/sendOtp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        return { message: data.message };  // Trả về message từ server
      } else {
        return rejectWithValue(data.message || 'Failed to send OTP.');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Trong profileSlice.js, thêm một async thunk mới để verify mật khẩu
export const verifyCurrentPassword = createAsyncThunk(
  'profile/verifyCurrentPassword',
  async ({ currentPassword }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/changePassword`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: currentPassword,
          newPassword: currentPassword, // Chỉ để verify mật khẩu
          otp: '000000' // Gửi OTP giả để bỏ qua kiểm tra OTP
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.passwordSuccess === true) {
        return { message: data.message };  // Trả về message từ server nếu thành công
      }
      return rejectWithValue(data.message || 'Mật khẩu cũ không chính xác');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Async thunk cho việc thay đổi mật khẩu
export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async ({ currentPassword, newPassword, otp }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${config.API_HOST}/api/user/changePassword`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: currentPassword,
          newPassword: newPassword,
          otp: otp
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!data.success) {
        return rejectWithValue(data.message); // Trả về message lỗi nếu không thành công
      }
      return { message: data.message };  // Trả về message nếu thành công
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


const initialState = {
  profileData: null,
  loading: false,
  updating: false,
  avatarUploading: false,
  followStats: { followers: 0, following: 0 },
  posts: [],
  featuredNote: null,
  isFollowing: false,
  userIdFollowing: null,
  otpSending: false,
  passwordChanging: false,
  otpMessage: null,
  passwordMessage: null,
  error: null,
  showOTPModal: false, // Thêm trạng thái showOTPModal
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileData: (state) => {
      return initialState;
    },
    updateProfilePicture: (state, action) => {
      if (state.profileData) {
        state.profileData.profilePicture = action.payload;
      }
    },
    setShowOTPModal: (state, action) => {
      state.showOTPModal = action.payload;
    },
    clearMessages: (state) => {
      state.otpMessage = null;
      state.passwordMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileData.fulfilled, (state, action) => {
        state.loading = false;
        state.profileData = action.payload.user;
        state.followStats.followers = action.payload.followers;
        state.followStats.following = action.payload.following;
        state.posts = action.payload.posts;
        state.featuredNote = action.payload.featuredNote;
        state.isFollowing = action.payload.isFollowing;
        state.userIdFollowing = action.payload.user.following;
      })
      .addCase(fetchProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updating = false;
        state.profileData = {
          ...state.profileData,
          ...action.payload,
        };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      .addCase(uploadProfilePicture.pending, (state) => {
        state.avatarUploading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.avatarUploading = false;
        if (state.profileData) {
          state.profileData = {
            ...state.profileData,
            profilePicture: action.payload
          };
        }
      })
      // các cases cho uploadProfilePicture
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.avatarUploading = false;
        state.error = action.payload;
      })
      .addCase(removeProfilePicture.pending, (state) => {
        state.avatarUploading = true;
        state.error = null;
      })
      .addCase(removeProfilePicture.fulfilled, (state, action) => {
        state.avatarUploading = false;
        state.profileData.profilePicture = action.payload;
      })
      .addCase(removeProfilePicture.rejected, (state, action) => {
        state.avatarUploading = false;
        state.error = action.payload;
      })
      // các cases cho sendOtp
      .addCase(sendOtp.pending, (state) => {
        state.otpSending = true;
        state.error = null;
        state.otpMessage = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.otpSending = false;
        state.otpMessage = action.payload.message;
        state.showOTPModal = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.otpSending = false;
        state.error = action.error.message;
      })
      //  các cases cho changePassword
      .addCase(changePassword.pending, (state) => {
        state.passwordChanging = true;
        state.error = null;
        state.passwordMessage = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordChanging = false;
        state.passwordMessage = action.payload.message;
        state.showOTPModal = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordChanging = false;
        state.error = action.payload || 'Có lỗi xảy ra khi đổi mật khẩu';
        state.passwordMessage = null;
      })
      //các cases cho verifyCurrentPassword
      .addCase(verifyCurrentPassword.pending, (state) => {
        state.passwordChanging = true;
        state.error = null;
      })
      .addCase(verifyCurrentPassword.fulfilled, (state) => {
        state.passwordChanging = false;
        state.error = null;
      })
      .addCase(verifyCurrentPassword.rejected, (state, action) => {
        state.passwordChanging = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileData, updateProfilePicture, clearMessages, setShowOTPModal } = profileSlice.actions;
export default profileSlice.reducer;