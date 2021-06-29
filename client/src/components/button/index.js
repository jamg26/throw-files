import { Button } from 'antd';
import styled from 'styled-components';

export const ButtonComponent = (props) => {
  return <Styled {...props}>{props.children}</Styled>;
};

const Styled = styled(Button)``;
