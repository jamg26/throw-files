// import { Button as AntButton } from 'antd';
import styled from 'styled-components';
import { Button as PCakeButton } from '@pancakeswap-libs/uikit';

export const Button = (props) => {
    return <ButtonContainer {...props}>{props.children}</ButtonContainer>;
};

const ButtonContainer = styled(PCakeButton)``;
