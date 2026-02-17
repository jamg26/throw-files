import { Link } from 'react-router-dom';
import styled from 'styled-components';

export const Header = () => {
  return (
    <HeaderContainer>
      <Link to='/'>ThrowMyFile</Link>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  a {
    margin: 0 10px;
    font-weight: bold;
    color: #7C3AED;
    text-decoration: none;
  }
`;
