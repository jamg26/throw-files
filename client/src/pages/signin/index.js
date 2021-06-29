import { useDispatch } from 'react-redux';
import { signinAction } from '../../actions';
import { useState } from 'react';
import { Button } from '../../components';

export const Signin = (props) => {
  const [login, setLogin] = useState({});
  const dispatch = useDispatch();
  const signin = (loginDetails, callback) => dispatch(signinAction(loginDetails, callback));

  const onSubmit = () => {
    signin(login, () => {
      props.history.push('/');
    });
  };

  const handleChange = (e) => {
    setLogin({
      ...login,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <fieldset>
        <label>Email</label>
        <input name='email' type='text' component='input' autoComplete='none' onChange={handleChange} />
      </fieldset>
      <fieldset>
        <label>Password</label>
        <input name='password' type='password' component='input' autoComplete='none' onChange={handleChange} />
      </fieldset>
      <Button onClick={onSubmit}>sign in</Button>
    </>
  );
};
