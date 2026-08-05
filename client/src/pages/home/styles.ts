// Styled-components and keyframes for the Home page.
// Split out of index.tsx, which had grown past 2,400 lines with logic and
// presentation interleaved.
import styled, { css, keyframes, createGlobalStyle } from "styled-components";
import { Input } from "../../components";
export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const fadeInScale = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

export const glow = keyframes`
  0%, 100% { box-shadow: 0 0 30px var(--accent-glow), 0 0 60px var(--accent-glow); }
  50% { box-shadow: 0 0 50px var(--accent-glow-strong), 0 0 100px var(--accent-glow); }
`;

export const glowPulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

export const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(2deg); }
  75% { transform: translateY(4px) rotate(-1deg); }
`;

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

export const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(100px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

export const borderGlow = keyframes`
  0%, 100% { border-color: var(--accent-glow); }
  50% { border-color: var(--accent-glow-strong); }
`;

export const GlobalStyle = createGlobalStyle`
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes particleFloat {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
  }
`;


export const HomeComponent = styled.div`
  min-height: 100vh;
  min-height: 100dvh; /* avoids the mobile URL-bar gap */
  position: relative;
  z-index: 2;
`;

export const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 80px 16px 24px;

  /* Skip-link target: focused programmatically, so suppress the ring for mouse
     users but keep it for keyboard navigation. */
  &:focus:not(:focus-visible) {
    outline: none;
  }

  @media (max-width: 480px) {
    padding: 48px 12px 16px;
    align-items: flex-start;
  }
`;

export const CardWrapper = styled.div`
  width: 100%;
  max-width: 520px;
  position: relative;

  @media (max-width: 480px) {
    max-width: 100%;
  }

  @media (min-width: 1024px) {
    max-width: 560px;
  }
`;

export const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 28px;
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: var(--border-accent);
    transform: translateY(-6px);
    box-shadow:
      var(--shadow-xl),
      0 0 120px var(--accent-glow);
  }
`;

export const CardBorderGlow = styled.div`
  position: absolute;
  inset: -1px;
  border-radius: 28px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--accent-primary),
    var(--accent-tertiary),
    var(--accent-sky)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;

  ${Card}:hover & {
    opacity: 0.6;
    animation: ${borderGlow} 2s ease-in-out infinite;
  }
`;

export const HeaderSection = styled.div`
  text-align: center;
  padding: 32px 28px 24px;
  position: relative;

  @media (max-width: 480px) {
    padding: 24px 18px 20px;
  }
`;

export const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
`;

export const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  background: var(--accent-gradient);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  animation: ${float} 4s ease-in-out infinite;
  box-shadow:
    0 0 30px var(--accent-glow-strong),
    0 12px 40px rgba(129, 140, 248, 0.25);
`;

export const UploadIconWrapper = styled.div`
  color: white;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
`;

export const LogoRing = styled.div`
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px solid var(--accent-primary);
  border-radius: 24px;
  top: -8px;
  left: -8px;
  opacity: 0.3;
  animation: ${glowPulse} 3s ease-in-out infinite;
`;

export const LogoRingDelayed = styled(LogoRing)`
  width: 100px;
  height: 100px;
  border-radius: 30px;
  top: -16px;
  left: -16px;
  animation-delay: 0.5s;
  opacity: 0.15;
`;

export const LogoGlowBlob = styled.div`
  position: absolute;
  width: 120px;
  height: 120px;
  background: var(--accent-gradient);
  border-radius: 50%;
  filter: blur(35px);
  opacity: 0.25;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${glowPulse} 4s ease-in-out infinite;
`;

export const Title = styled.h1`
  font-size: clamp(26px, 6.5vw, 34px);
  font-weight: 800;
  letter-spacing: -1.5px;
  color: var(--text-primary);
  margin: 0 0 12px;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--accent-secondary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 360px) {
    font-size: 24px;
    letter-spacing: -1px;
  }
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 auto 20px;
  line-height: 1.6;
  max-width: 34ch;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
`;

export const FeatureBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

export const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  animation: ${fadeInUp} 0.5s ease both;
  animation-delay: 0.3s;

  svg {
    color: var(--accent-primary);
  }

  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 10px;
  }
`;

export const ChannelSection = styled.div`
  margin-bottom: 20px;
`;

export const ChannelLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
`;

export const ChannelBox = styled.div<{ $focused?: boolean }>`
  background: var(--bg-tertiary);
  border: 1px solid
    ${(p) => (p.$focused ? "var(--accent-primary)" : "var(--border-subtle)")};
  border-radius: 18px;
  padding: 22px 26px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(p) =>
    p.$focused
      ? "0 0 0 4px var(--accent-glow), 0 8px 32px rgba(0,0,0,0.2)"
      : "none"};

  &:hover {
    border-color: var(--border-accent);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
    border-color: ${(p) =>
      p.$focused ? "var(--accent-primary)" : "var(--border-subtle)"};
    box-shadow: ${(p) =>
      p.$focused
        ? "0 0 0 4px var(--accent-glow), 0 4px 20px var(--accent-glow)"
        : "var(--shadow-sm)"};
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }
`;

export const ChannelCode = styled.span`
  font-family: "Inter", monospace;
  font-size: clamp(24px, 7vw, 38px);
  font-weight: 700;
  letter-spacing: clamp(2px, 1.2vw, 6px);
  color: var(--accent-primary);
  flex: 1;
  min-width: 0;
  word-break: break-word;
  text-align: left;
  text-shadow: 0 0 40px var(--accent-glow);

  @media (max-width: 360px) {
    font-size: 22px;
    letter-spacing: 1px;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    justify-content: flex-end;
  }
`;

export const IconButton = styled.button`
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  min-width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--accent-glow);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    transform: scale(1.05);
    box-shadow: 0 4px 20px var(--accent-glow);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const IconButtonSecondary = styled(IconButton)`
  background: var(--bg-tertiary);
`;

export const InputWrapper = styled.div`
  flex: 1;
`;

export const JoinSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 28px;

  @media (max-width: 600px) {
    flex-wrap: wrap;
    gap: 10px;

    ${InputWrapper} {
      width: 100%;
      flex: none;
    }

    > button,
    > div {
      flex: 1;
      min-width: 0;
    }
  }
`;

export const StyledInput = styled(Input)`
  height: 54px;
  font-size: 16px;
  letter-spacing: 3px;
  border-radius: 16px;
  text-transform: uppercase;
  font-weight: 600;

  @media (max-width: 480px) {
    height: 48px;
    font-size: 15px;
    letter-spacing: 2px;
  }
`;

export const TransferList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
`;

export const TransferItem = styled.div<{ $delay: number }>`
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 20px 22px;
  animation: ${fadeInUp} 0.5s ease ${(p) => p.$delay}ms both;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-primary);
    transform: translateX(6px);
    box-shadow: 0 8px 32px rgba(129, 140, 248, 0.15);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }
`;

export const TransferItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const FileNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

export const FileIconWrapper = styled.div<{ $receiving?: boolean }>`
  color: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  flex-shrink: 0;
`;

export const FileNameText = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ZipBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-tertiary);
  background: rgba(192, 132, 252, 0.15);
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  flex-shrink: 0;
`;

export const TransferStatus = styled.span<{ $receiving?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const StatusDot = styled.span<{ $receiving?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  animation: ${pulse} 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px
    ${(p) => (p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)")};
`;

export const ProgressTrack = styled.div`
  height: 8px;
  background: var(--border-subtle);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
`;

export const ProgressFill = styled.div`
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 4px;
  /* Progress arrives once per chunk — many times a second. A 0.3s ease made the
     bar visibly lag behind the real byte count. */
  transition: width 0.12s linear;
  position: relative;
  overflow: hidden;
`;

export const ProgressGlow = styled.div`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: ${shimmer} 1.5s infinite;
`;

export const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
`;

export const ProgressPercent = styled.span`
  color: var(--accent-primary);
  font-weight: 700;
`;

export const ProgressSize = styled.span`
  color: var(--text-muted);
`;

export const FileSection = styled.div<{ $dragging?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  border-radius: 18px;
  transition:
    background 0.2s ease,
    outline-color 0.2s ease;
  outline: 2px dashed transparent;
  outline-offset: -8px;

  ${(p) =>
    p.$dragging &&
    css`
      background: var(--accent-glow);
      outline-color: var(--accent-primary);
    `}
`;

export const ConnectionBanner = styled.div<{ $state: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  background: ${(p) =>
    p.$state === "failed"
      ? "rgba(248, 113, 113, 0.12)"
      : "rgba(251, 191, 36, 0.12)"};
  border: 1px solid
    ${(p) =>
      p.$state === "failed"
        ? "rgba(248, 113, 113, 0.35)"
        : "rgba(251, 191, 36, 0.35)"};
  color: ${(p) => (p.$state === "failed" ? "var(--danger)" : "var(--warning)")};

  span {
    flex: 1;
  }
`;

export const BannerAction = styled.button`
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 8px;
  padding: 4px 12px;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: currentColor;
    filter: brightness(1.4);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

export const CancelButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s ease;

  &:hover {
    color: var(--danger);
    border-color: var(--danger);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
`;

export const ReadyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
`;

export const ReadyItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  background: var(--success-glow);
  border: 1px solid rgba(52, 211, 153, 0.3);
  border-radius: 16px;
  animation: ${fadeInUp} 0.4s ease both;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
`;

export const ReadyActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

export const ReadySize = styled.span`
  font-size: 12px;
  color: var(--text-tertiary);
`;

export const LoadingDotsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

export const LoadingDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-gradient);
  animation: bounce 1.4s ease-in-out infinite both;

  &:nth-of-type(1) {
    animation-delay: -0.32s;
  }
  &:nth-of-type(2) {
    animation-delay: -0.16s;
  }
`;

export const SendButtonWrapper = styled.div`
  text-align: center;
`;

export const SendButton = styled.button`
  background: var(--accent-gradient);
  background-size: 200% 200%;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 22px 72px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  box-shadow:
    0 8px 40px rgba(129, 140, 248, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Inter", sans-serif;
  letter-spacing: -0.02em;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow:
      0 16px 60px rgba(129, 140, 248, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    animation: ${gradientShift} 2s ease infinite;
  }

  &:active {
    transform: translateY(-3px) scale(0.98);
  }

  [data-theme="light"] & {
    box-shadow:
      0 8px 32px rgba(99, 102, 241, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;

    &:hover {
      box-shadow:
        0 16px 48px rgba(99, 102, 241, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.3) inset;
    }
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 4px;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 16px 24px;
    font-size: 16px;
    gap: 10px;
    border-radius: 18px;
  }
`;

export const SendButtonIcon = styled.div`
  display: flex;
  transition: transform 0.3s ease;

  ${SendButton}:hover & {
    transform: translateY(-3px) scale(1.1);
  }
`;

export const SendButtonText = styled.span``;

export const ButtonShine = styled.div`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.7s ease;

  ${SendButton}:hover & {
    left: 100%;
  }
`;

export const PasteHint = styled.p`
  margin-top: 18px;
  font-size: 14px;
  color: var(--text-muted);

  @media (max-width: 480px) {
    font-size: 13px;
    margin-top: 14px;
  }
`;

export const PasteText = styled.span`
  color: var(--accent-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--accent-secondary);
    text-decoration: underline;
  }
`;

export const HistorySection = styled.div`
  margin-top: 28px;
  padding: 22px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--border-medium);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }

  @media (max-width: 480px) {
    padding: 16px;
    margin-top: 22px;
  }
`;

export const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
`;

export const HistoryTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);

  svg {
    color: var(--accent-amber);
  }
`;

export const HistoryStats = styled.span`
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-glass);
  padding: 5px 14px;
  border-radius: 20px;
`;

export const HistoryContent = styled.div`
  max-height: 240px;
  overflow-y: auto;
`;

export const EmptyHistoryState = styled.div`
  text-align: center;
  padding: 28px;
`;

export const InlineHistoryItem = styled.div<{ $delay: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  margin-bottom: 10px;
  animation: ${fadeInUp} 0.4s ease ${(p) => p.$delay}ms both;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-primary);
    transform: translateX(8px);
    box-shadow: 0 4px 24px var(--accent-glow);
  }

  @media (max-width: 400px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
  }
`;

export const InlineLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

export const InlineStatusBadge = styled.span<{ $type: "sent" | "received" }>`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: ${(p) =>
    p.$type === "sent" ? "var(--success-glow)" : "var(--accent-glow)"};
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const InlineFileName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const InlineRight = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;

  @media (max-width: 400px) {
    gap: 10px;
  }
`;

export const InlineTime = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

export const InlineTypeBadge = styled.span<{ $type: "sent" | "received" }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
`;

export const SeeMoreButton = styled.button`
  background: linear-gradient(135deg, var(--accent-glow), transparent);
  border: 1px dashed var(--border-medium);
  border-radius: 14px;
  padding: 14px;
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: "Inter", sans-serif;
  animation: ${fadeInUp} 0.4s ease;

  &:hover {
    background: var(--accent-primary);
    color: white;
    border-style: solid;
    transform: scale(1.02);
  }
`;

export const ViewAllButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s ease;
  font-family: "Inter", sans-serif;

  &:hover {
    background: var(--accent-glow);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
`;

export const Footer = styled.div`
  margin-top: 32px;
  text-align: center;
`;

export const UserCountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-glass);
  padding: 12px 24px;
  border-radius: 28px;
  margin-bottom: 18px;
  border: 1px solid var(--border-subtle);

  svg {
    color: var(--accent-emerald);
  }
`;

export const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: var(--text-muted);
  flex-wrap: wrap;

  a {
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--accent-primary);
      transform: scale(1.1);
    }
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

export const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--accent-primary);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

// Particles
//
// This used to be an empty styled.div while the real rules lived in App.less
// under a `.particles` class the component never applied. The particles were
// therefore unclipped (they travel +/-100vh) and visible in light mode.
export const ParticlesContainer = styled.div`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  contain: strict;

  [data-theme="light"] & {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

export const Particle = styled.div`
  position: absolute;
  top: 0;
  border-radius: 50%;
  pointer-events: none;
  animation: particleFloat linear infinite;
`;

// Modal Components
export const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
`;

export const HistoryWrapper = styled.div`
  width: 36px;
  height: 36px;
  background: var(--accent-glow);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
`;

export const CountBadge = styled.span`
  background: var(--accent-gradient);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 20px;
`;

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

export const TabBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--bg-tertiary);
  border-radius: 16px;
  margin-bottom: 24px;

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }
`;

export const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 14px 18px;
  border: none;
  background: ${(p) => (p.$active ? "var(--accent-gradient)" : "transparent")};
  color: ${(p) => (p.$active ? "white" : "var(--text-secondary)")};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? "700" : "500")};
  border-radius: 14px;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: "Inter", sans-serif;

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--accent-gradient)" : "var(--bg-glass)"};
  }
`;

export const TabCount = styled.span<{ $active: boolean }>`
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,0.2)" : "var(--bg-glass)"};
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
`;

export const EmptyIconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: var(--bg-tertiary);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
`;

export const EmptyTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

export const EmptySubtitle = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;

export const HistoryList = styled.div`
  max-height: 480px;
  overflow-y: auto;
`;

export const HistoryItem = styled.div<{ $visible: boolean; $delay: number }>`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 18px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-subtle);
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: translateX(${(p) => (p.$visible ? 0 : -30)}px);
  transition: all 0.4s ease ${(p) => p.$delay}ms;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--bg-glass);
    margin: 0 -16px;
    padding: 18px 16px;
    border-radius: 14px;
  }
`;

export const HistoryItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

export const StatusBadge = styled.span<{ $type: "sent" | "received" }>`
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: ${(p) =>
    p.$type === "sent" ? "var(--success-glow)" : "var(--accent-glow)"};
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const HistoryFileNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const FileName = styled.span``;

export const HistoryItemRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
`;

export const MetaText = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

export const TypeBadge = styled.span<{ $type: "sent" | "received" }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
`;

export const FileSizeText = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

// Toast Components
export const ToastContainerWrapper = styled.div`
  position: fixed;
  top: 90px;
  right: 28px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: calc(100vw - 32px);

  /* A 340px min-width toast pinned 28px from the right ran off the side of any
     phone narrower than ~370px, where overflow-x:hidden then clipped it. */
  @media (max-width: 520px) {
    top: 72px;
    left: 12px;
    right: 12px;
    max-width: none;
    gap: 10px;
  }
`;

export const ToastContainer = styled.div<{ $visible: boolean; $leaving: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  min-width: min(340px, 100%);
  max-width: 440px;
  transform: translateX(${(p) => (p.$leaving ? "120%" : "0")});
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  @media (max-width: 520px) {
    min-width: 0;
    max-width: none;
    width: 100%;
    padding: 14px 16px;
    gap: 12px;
  }
`;

export const ToastIconWrapper = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ToastTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

export const ToastDescription = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 3px;
`;

export const ToastClose = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-glass);
    color: var(--text-primary);
  }
`;

export const ToastProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  animation: toastProgress 5s linear forwards;

  @keyframes toastProgress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

export const SkipToContent = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-primary);
  color: white;
  padding: 8px 16px;
  z-index: 9999;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  transition: top 0.3s ease;

  &:focus {
    top: 0;
  }
`;
