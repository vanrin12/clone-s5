import { configureStore } from '@reduxjs/toolkit';
import profileReducer from './features/profile/profileSlice';
import newPostReducer from './features/NewPost/newPostSlice';
import commentsReducer from './features/Comment/Comment';
import uploadModalReducer from "./features/uploadModal/uploadModalSlice";
import messengerReducer from "./features/Messenger/messagerSlice";
import userReducer from './features/User/userSlice';

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    newPost: newPostReducer,
    comments: commentsReducer,
    uploadModal: uploadModalReducer,
    messenger: messengerReducer,
    user: userReducer,
  },
});

export default store;