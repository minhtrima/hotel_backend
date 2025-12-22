import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  error: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    stateStart: (state) => {
      state.loading = true;
    },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    stateFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    signOut: (state) => {
      state.currentUser = null;
      state.error = null;
      state.loading = false;
    },
    updateUserName: (state, action) => {
      if (state.currentUser) {
        state.currentUser.user.name = action.payload;
      }
    },
    updateUserAvatar: (state, action) => {
      if (state.currentUser) {
        state.currentUser.user.avatar = action.payload;
      }
    },
  },
});

export const {
  stateStart,
  signInSuccess,
  stateFailure,
  updateUserName,
  updateUserAvatar,
  signOut,
} = userSlice.actions;

export default userSlice.reducer;
