import axios from 'axios';
import { createSlice } from '@reduxjs/toolkit';
import { apiUrl } from '../../const.js';

const accessTokenStorageKey = 'jarr-access-token';

const loginSlice = createSlice({
  name: 'login',
  initialState: { loading: false, error: undefined,
                  login: undefined, password: undefined,
                  token: sessionStorage.getItem(accessTokenStorageKey)},
  reducers: {
    attemptLogin(state, action) {
        const { login, password } = action.payload;
        return { ...state, login, password, loading: true };
    },
    loginFailed(state, action) {
        return { ...state, loading: false, token: undefined,
                 error: action.payload.error };
    },
    tokenAcquired(state, action) {
        sessionStorage.setItem(accessTokenStorageKey,
                               action.payload.data.access_token);
        return { ...state, loading: false,
                 token: action.payload.data.access_token };
    },
    tokenExpire(state, action) {
        return { ...state, loading: true, token: undefined };
    },
    logout() {
        return { loading: false, error: undefined,
                 login: undefined, password: undefined, token: undefined, };
    }
  }
});

export const { attemptLogin, loginFailed, tokenAcquired, tokenExpire, logout } = loginSlice.actions;

export default loginSlice.reducer;

export const doLogin = (
  login: string,
  password: string
): AppThunk => async dispatch => {
  try {
    dispatch(attemptLogin({ login, password }));
    const result = await axios.post(
        apiUrl + '/auth',
        { login, password },
        { responseType: 'json' },
    );
    dispatch(tokenAcquired(result))
  } catch (err) {
    dispatch(loginFailed({ error: err.toString() }))
  }
}