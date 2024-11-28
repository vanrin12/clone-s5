import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  profilePicture: null,
  username: "",
  fullname: "",
  onUploadSuccess: null, // Callback to execute after success
};

const uploadModalSlice = createSlice({
  name: "uploadModal",
  initialState,
  reducers: {
    openUploadModal: (state, action) => {
      const { profilePicture, username, fullname, onUploadSuccess } = action.payload;
      state.isOpen = true;
      state.profilePicture = profilePicture || null;
      state.username = username || "";
      state.fullname = fullname || "";
      state.onUploadSuccess = onUploadSuccess || null;
    },
    closeUploadModal: (state) => {
      state.isOpen = false;
      state.profilePicture = null;
      state.username = "";
      state.fullname = "";
      state.onUploadSuccess = null;
    },
  },
});

export const { openUploadModal, closeUploadModal } = uploadModalSlice.actions;
export default uploadModalSlice.reducer;
