import styled from 'styled-components';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';

interface ButtonProps extends AntButtonProps {
    scale?: 'sm' | 'md';
    variant?: 'primary' | 'danger' | 'text' | 'secondary' | 'tertiary' | 'success';
}

export const Button = ({ scale, variant, ...props }: ButtonProps) => {
    let type: AntButtonProps['type'] = 'default';
    let danger = false;
    let style = props.style || {};

    if (variant === 'primary') type = 'primary';
    if (variant === 'danger') { type = 'primary'; danger = true; }
    if (variant === 'text') type = 'text';
    if (variant === 'secondary') type = 'default';
    if (variant === 'tertiary') type = 'dashed';
    if (variant === 'success') {
        type = 'primary';
        style = { ...style, backgroundColor: '#52c41a', borderColor: '#52c41a' };
    }

    const size = scale === 'sm' ? 'small' : 'middle';

    return <ButtonContainer type={type} danger={danger} size={size} style={style} {...props}>{props.children}</ButtonContainer>;
};

const ButtonContainer = styled(AntButton)`
    :hover {
        transform: scale(0.95);
    }
`;
