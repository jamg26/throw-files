import { Button as AntButton } from 'antd';
import styled from 'styled-components';

export const Button = (props) => {
  return <ButtonContainer {...props}>{props.children}</ButtonContainer>;
};

const ButtonContainer = styled(AntButton)``;
