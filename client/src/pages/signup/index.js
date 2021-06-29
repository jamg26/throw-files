import { useDispatch } from 'react-redux';
import { signupAction } from '../../actions';
import { useState } from 'react';
import { Button } from '../../components';

export const Signup = (props) => {
  const [info, setInfo] = useState({});
  const dispatch = useDispatch();
  const signup = (info, callback) => dispatch(signupAction(info, callback));

  const onSubmit = () => {
    signup(info, () => {
      props.history.push('/');
    });
  };

  const handleChange = (e) => {
    setInfo({
      ...info,
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
      <Button onClick={onSubmit}>Submit</Button>
    </>
  );
};
