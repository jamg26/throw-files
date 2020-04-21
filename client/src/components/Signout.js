import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';

const Signout = (props) => {
  useEffect(() => {
    props.signout();
  }, []);

  return <h3>Sign out!</h3>;
};

export default connect(null, actions)(Signout);
