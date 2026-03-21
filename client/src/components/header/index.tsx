import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Send, Github } from 'lucide-react';

export const Header = () => {
  return (
    <HeaderContainer>
      <LogoLink to='/'>
        <LogoMark>
          <Send size={15} />
        </LogoMark>
        <LogoText>ThrowMyFile</LogoText>
      </LogoLink>
      <NavActions>
        <NavAnchor
          href="https://github.com/jamg26/throw-files"
          target="_blank"
          rel="noopener noreferrer"
          title="View Source on GitHub"
        >
          <Github size={17} />
        </NavAnchor>
      </NavActions>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 64px;
  background: rgba(12, 12, 28, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  &:hover > span:last-child {
    color: #A78BFA;
  }
`;

const LogoMark = styled.div`
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #7C3AED 0%, #F43F5E 100%);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
  flex-shrink: 0;
  transform: rotate(-15deg);
`;

const LogoText = styled.span`
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 17px;
  color: #E2E8F0;
  letter-spacing: -0.4px;
  transition: color 0.2s ease;
`;

const NavActions = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NavAnchor = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 17px;
  transition: all 0.2s ease;
  background: transparent;

  &:hover {
    color: #A78BFA;
    background: rgba(124, 58, 237, 0.12);
  }
`;
