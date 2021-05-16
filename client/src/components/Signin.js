import { connect } from "react-redux";
import * as actions from "../actions/auth";
import { useState } from "react";

const Signin = (props) => {
  const [login, setLogin] = useState({});

  const onSubmit = () => {
    console.log(login);
    props.signin(login, () => {
      props.history.push("/");
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
      <button onClick={onSubmit}>sign in</button>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    errorMessage: state.auth.errorMessage,
  };
};

export default connect(mapStateToProps, actions)(Signin);
