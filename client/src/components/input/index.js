import styled from 'styled-components';
import { Input as PCakeInput } from '@pancakeswap-libs/uikit';

export const Input = (props) => {
    return <Container {...props}>{props.children}</Container>;
};

const Container = styled(PCakeInput)``;
