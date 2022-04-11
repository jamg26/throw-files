import styled from 'styled-components';
import { Card as Component, CardBody as Component2, CardHeader as Component3 } from '@pancakeswap/uikit';

export const Card = (props) => {
    return <Container {...props}>{props.children}</Container>;
};

export const CardBody = (props) => {
    return <Container2 {...props}>{props.children}</Container2>;
};

export const CardHeader = (props) => {
    return <Container3 {...props}>{props.children}</Container3>;
};

const Container = styled(Component)``;
const Container2 = styled(Component2)``;
const Container3 = styled(Component3)``;
