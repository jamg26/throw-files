import { Typography } from 'antd';
import { TextProps as AntTextProps } from 'antd/lib/typography/Text';
import { CSSProperties, ReactNode } from 'react';

const { Text: AntText } = Typography;

interface CustomTextProps extends AntTextProps {
    small?: boolean;
    bold?: boolean;
    color?: string;
    fontSize?: string;
    children?: ReactNode;
    mb?: string;
}

export const Text = ({ small, bold, color, fontSize, children, mb, ...props }: CustomTextProps) => {
    let style: CSSProperties = { ...props.style };
    let type = props.type;
    
    if (small) {
        style.fontSize = '12px';
    }
    if (fontSize) {
        style.fontSize = fontSize;
    }
    if (mb) {
        style.marginBottom = mb;
    }
    if (color) {
        if (color === 'textSubtle' || color === 'secondary') {
            type = 'secondary';
        } else if (color === 'success') {
            type = 'success';
        } else if (color === 'warning') {
            type = 'warning';
        } else if (color === 'danger') {
            type = 'danger';
        } else {
            style.color = color;
        }
    }

    return (
        <AntText strong={bold} style={style} type={type} {...props}>
            {children}
        </AntText>
    );
};
