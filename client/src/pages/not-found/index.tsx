import { Compass } from "lucide-react";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Button, Card, CardBody } from "../../components";

const NotFound = () => {
  const history = useHistory();

  return (
    <Container>
      <Card>
        <CardBody>
          <Inner>
            <Compass size={44} color="var(--accent-primary)" aria-hidden="true" />
            <h1>Nothing here</h1>
            <p>
              That link does not point anywhere. The transfer page is where
              everything happens.
            </p>
            <Button variant="primary" onClick={() => history.push("/")}>
              Go to Transfer
            </Button>
          </Inner>
        </CardBody>
      </Card>
    </Container>
  );
};

const Container = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px 24px;

  > * {
    width: 100%;
    max-width: 440px;
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;

  h1 {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }

  p {
    margin: 0 0 6px;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-secondary);
  }
`;

export default NotFound;
