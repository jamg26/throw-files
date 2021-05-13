import React from "react";
import { connect } from "react-redux";
import * as actions from "../actions/auth";

const Signup = (props) => {
  const [info, setInfo] = React.useState({});

  const onSubmit = () => {
    props.signup(info, () => {
      props.history.push("/");
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
        <input
          name="email"
          type="text"
          component="input"
          autoComplete="none"
          onChange={handleChange}
        />
      </fieldset>
      <fieldset>
        <label>Password</label>
        <input
          name="password"
          type="password"
          component="input"
          autoComplete="none"
          onChange={handleChange}
        />
      </fieldset>
      <p>{props.errorMessage}</p>
      <button onClick={onSubmit}>Submit</button>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
  };
};

export default connect(mapStateToProps, actions)(Signup);
