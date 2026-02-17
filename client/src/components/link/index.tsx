import { Typography } from 'antd';
import { LinkProps as AntLinkProps } from 'antd/lib/typography/Link';
import { CSSProperties, ReactNode } from 'react';

const { Link: AntLink } = Typography;

interface CustomLinkProps extends AntLinkProps {
    small?: boolean;
    bold?: boolean;
    color?: string;
    fontSize?: string;
    children?: ReactNode;
}

export const Link = ({ small, bold, color, fontSize, children, ...props }: CustomLinkProps) => {
    let style: CSSProperties = { ...props.style };
    let type = props.type;
    
    if (small) {
        style.fontSize = '12px';
    }
    if (fontSize) {
        style.fontSize = fontSize;
    }
    // Map colors if needed, but Ant Link uses type='secondary' etc.
    if (color) {
        if (color === 'textSubtle' || color === 'secondary') {
             // Ant Link doesn't have secondary type in the same way Text does?
             // Actually it does: secondary, success, warning, danger
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
        <AntLink strong={bold} style={style} type={type} {...props}>
            {children}
        </AntLink>
    );
};
