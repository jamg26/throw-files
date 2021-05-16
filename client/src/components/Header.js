import { Link } from "react-router-dom";
import { connect } from "react-redux";
import "./HeaderStyle.css";

const Header = (props) => {
  const renderLinks = () => {
    if (props.authenticated) {
      return (
        <div>
          <Link to="/signout">Sign Out</Link>
        </div>
      );
    } else {
      return (
        <div>
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
        </div>
      );
    }
  };

  return (
    <div className="header">
      <Link to="/">TITLE</Link>
      {renderLinks()}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    authenticated: state.auth.authenticated,
  };
};

export default connect(mapStateToProps)(Header);
