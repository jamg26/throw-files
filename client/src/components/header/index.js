import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './HeaderStyle.css';

export const Header = (props) => {
  const authenticated = useSelector((state) => state.auth.authenticated);

  const renderLinks = () => {
    if (authenticated) {
      return (
        <div>
          <Link to='/signout'>Sign Out</Link>
        </div>
      );
    } else {
      return (
        <div>
          <Link to='/signin'>Sign In</Link>
          <Link to='/signup'>Sign Up</Link>
        </div>
      );
    }
  };

  return (
    <div className='header'>
      <Link to='/'>TITLE</Link>
      {renderLinks()}
    </div>
  );
};
