// import { Button as AntButton } from 'antd';
import styled from 'styled-components';
import { Button as PCakeButton } from '@pancakeswap/uikit';

export const Button = (props) => {
    return <ButtonContainer {...props}>{props.children}</ButtonContainer>;
};

const ButtonContainer = styled(PCakeButton)`
    :hover {
        scale: max(95%);
    }
`;
