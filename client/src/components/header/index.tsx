import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Github, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/theme';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <HeaderContainer>
      <LogoLink to='/'>
        <LogoMark>
          <UploadIcon>
            <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" />
          </UploadIcon>
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
  padding: 0 28px;
  height: 56px;
  background: var(--bg-secondary);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
`;

const LogoMark = styled.div`
  width: 32px;
  height: 32px;
  background: var(--accent-gradient);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  flex-shrink: 0;
`;

const UploadIcon = ({ children }: { children: React.ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const LogoText = styled.span`
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
  letter-spacing: -0.3px;
`;

const NavActions = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const navItemStyles = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: var(--text-secondary);
  font-size: 17px;
  transition: all 0.2s ease;
  background: transparent;
  cursor: pointer;
  border: none;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-glass);
  }
`;

const NavAnchor = styled.a`${navItemStyles}`;
const NavButton = styled.button`${navItemStyles}`;