import React, { useEffect } from "react";
import { connect } from "react-redux";
import * as actions from "../actions/auth";

const Signout = (props) => {
  useEffect(() => {
    props.signout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <h3>Sign out!</h3>;
};

export default connect(null, actions)(Signout);
