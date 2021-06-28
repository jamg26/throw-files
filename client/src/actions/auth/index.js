import axios from 'axios';

export const signupAction = (formProps, callback) => async (dispatch) => {
  try {
    const response = await axios.post('/api/signup', formProps);
    dispatch({ type: 'AUTH_USER', payload: response.data.token });
    localStorage.setItem('token', response.data.token);
    callback();
  } catch (error) {
    dispatch({ type: 'AUTH_ERROR', payload: 'Email is in use' });
  }
};

export const signinAction = (formProps, callback) => async (dispatch) => {
  try {
    const response = await axios.post('/api/signin', formProps);
    dispatch({ type: 'AUTH_USER', payload: response.data.token });
    localStorage.setItem('token', response.data.token);
    callback();
  } catch (error) {
    dispatch({ type: 'AUTH_ERROR', payload: 'Invalid login credentials' });
  }
};

export const signoutAction = () => {
  localStorage.removeItem('token');
  return {
    type: 'AUTH_USER',
    payload: '',
  };
};
