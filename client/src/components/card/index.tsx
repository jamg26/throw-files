import styled from 'styled-components';
import { Card as AntCard, CardProps } from 'antd';
import { CSSProperties, ReactNode, HTMLAttributes } from 'react';

interface CustomCardProps extends CardProps {
    isWarning?: boolean;
    children?: ReactNode;
}

export const Card = ({ isWarning, ...props }: CustomCardProps) => {
    const style: CSSProperties = { ...props.style };
    if (isWarning) {
        style.border = '1px solid #7C3AED';
    }
    return <Container style={style} {...props}>{props.children}</Container>;
};

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
    style?: CSSProperties;
    children?: ReactNode;
}

export const CardBody = (props: CardSectionProps) => {
    return <div {...props} style={{ padding: '24px', ...props.style }}>{props.children}</div>;
};

export const CardHeader = (props: CardSectionProps) => {
    return <div {...props} style={{ padding: '24px', borderBottom: '1px solid rgba(124, 58, 237, 0.1)', ...props.style }}>{props.children}</div>;
};

const Container = styled(AntCard)`
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0px 2px 12px -8px rgba(25, 19, 38, 0.1), 0px 1px 1px rgba(25, 19, 38, 0.05);
`;
