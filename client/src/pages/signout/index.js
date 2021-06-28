import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { signoutAction } from '../../actions';

export const Signout = (props) => {
  const dispatch = useDispatch();
  const signout = () => dispatch(signoutAction());

  useEffect(() => {
    signout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <></>;
};
