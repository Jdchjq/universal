import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { UserProfile } from "@/types";
import { api } from "@/services/api";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async () => {
  const res = await api.get("/api/auth/me");
  if (res.code === 0) return res.data as UserProfile;
  return null;
});

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: { email: string; password: string }) => {
    const res = await api.post("/api/auth/login", credentials);
    if (res.code !== 0) throw new Error(res.message);
    return res.data as UserProfile;
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (data: { email: string; password: string; nickname: string }) => {
    const res = await api.post("/api/auth/register", data);
    if (res.code !== 0) throw new Error(res.message);
    return res.data as UserProfile;
  }
);

export const performLogout = createAsyncThunk("auth/performLogout", async () => {
  await api.post("/api/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
