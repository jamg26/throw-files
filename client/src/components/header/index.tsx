import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Send, Github, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/theme';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <HeaderContainer>
      <LogoLink to='/'>
        <LogoMark>
          <Send size={15} />
        </LogoMark>
        <LogoText>ThrowMyFile</LogoText>
      </LogoLink>
      <NavActions>
        <NavButton onClick={toggleTheme} title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </NavButton>
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
  background: var(--bg-header);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--border-header);
  transition: background 0.25s ease, border-color 0.25s ease;
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
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 17px;
  color: var(--text);
  letter-spacing: -0.4px;
  transition: color 0.2s ease;
`;

const NavActions = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const navItemStyles = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--nav-icon-color);
  font-size: 17px;
  transition: all 0.2s ease;
  background: transparent;
  cursor: pointer;
  border: none;

  &:hover {
    color: var(--nav-icon-hover-color);
    background: var(--nav-icon-hover-bg);
  }
`;

const NavAnchor = styled.a`${navItemStyles}`;
const NavButton = styled.button`${navItemStyles}`;
