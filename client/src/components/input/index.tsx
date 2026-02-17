import styled from 'styled-components';
import { Input as AntInput, InputProps } from 'antd';

export const Input = (props: InputProps) => {
    return <Container {...props} />;
};

const Container = styled(AntInput)``;
