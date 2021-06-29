import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

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
    <HeaderContainer>
      <Link to='/'>TITLE</Link>
      {renderLinks()}
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  a {
    margin: 0 10px;
  }
`;
