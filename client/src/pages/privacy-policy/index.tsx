import { Row, Col, Space, Typography } from "antd";
import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { Button, Card, CardBody, Text } from "../../components";
import styled from "styled-components";

const { Title } = Typography;

const PrivacyPolicy = () => {
  const history = useHistory();

  return (
    <PolicyContainer>
      <Row justify="center" style={{ padding: "40px 20px" }}>
        <Col xs={24} sm={22} md={18} lg={14} xl={12}>
          <Card style={{ marginBottom: "40px" }}>
            <CardBody>
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Button 
                  variant="text" 
                  onClick={() => history.push("/")}
                  style={{ padding: 0, height: "auto", display: "flex", alignItems: "center", gap: "8px", opacity: 0.7, color: "#E2E8F0" }}
                >
                  <ArrowLeftOutlined /> Back to Transfer
                </Button>

                <HeaderSection>
                  <SafetyCertificateOutlined style={{ fontSize: "48px", color: "#7C3AED", marginBottom: "16px" }} />
                  <Title level={1} style={{ margin: 0, color: "#E2E8F0", letterSpacing: "-1px" }}>
                    Privacy Policy
                  </Title>
                  <Text style={{ opacity: 0.6, color: "#94A3B8" }}>
                    Last Updated: February 17, 2026
                  </Text>
                </HeaderSection>

                <Divider />

                <Section>
                  <Title level={3} style={{ color: "#A78BFA" }}>Our Philosophy</Title>
                  <p>
                    ThrowMyFile was built on the principle of absolute privacy. We believe that your data belongs to you, and your transfers should remain between you and your recipient. Our architecture is designed to facilitate direct communication without ever seeing, storing, or processing your files.
                  </p>
                </Section>

                <Section>
                  <Title level={4} style={{ color: "#E2E8F0" }}>1. Data Transmission (P2P)</Title>
                  <p>
                    ThrowMyFile utilizes Peer-to-Peer (P2P) technology. Files are streamed directly from your device to the receiver's device. Our servers act merely as a "signaling" service to help devices find each other and establish a connection. Once the transfer begins, the data does not pass through any intermediate cloud storage.
                  </p>
                </Section>

                <Section>
                  <Title level={4} style={{ color: "#E2E8F0" }}>2. Zero Data Storage</Title>
                  <p>
                    We do not maintain any databases. We do not store your files, metadata, filenames, or history on our servers. Your "Transfer History" is stored locally in your browser's session memory and is permanently cleared as soon as you close the tab or refresh the page.
                  </p>
                </Section>

                <Section>
                  <Title level={4} style={{ color: "#E2E8F0" }}>3. Tracking & Cookies</Title>
                  <p>
                    We value simplicity. ThrowMyFile does not use tracking cookies, analytics scripts, or third-party marketing pixels. We do not track your IP address or your geographical location.
                  </p>
                </Section>

                <Section>
                  <Title level={4} style={{ color: "#E2E8F0" }}>4. Security</Title>
                  <p>
                    While we provide the infrastructure for direct transfers, we recommend using encrypted channels for sensitive data. We utilize modern Web APIs to ensure the most secure connection possible between peers.
                  </p>
                </Section>

                <Section>
                  <Title level={4} style={{ color: "#E2E8F0" }}>5. Contact</Title>
                  <p>
                    As an open-source project, we are committed to transparency. If you have questions about the underlying technology or our privacy practices, you can reach out via our GitHub repository or at <a href="mailto:jammmg26@gmail.com" style={{ color: "#7C3AED" }}>jammmg26@gmail.com</a>.
                  </p>
                </Section>

                <Divider />

                <div style={{ textAlign: "center", opacity: 0.5, padding: "20px 0" }}>
                  <Text small>
                    ThrowMyFile &copy; {new Date().getFullYear()} • Secure. Direct. Private.
                  </Text>
                </div>
              </Space>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </PolicyContainer>
  );
};

const PolicyContainer = styled.div`
  min-height: 100vh;
  background-color: #0F0F23;
  color: #E2E8F0;
  
  p {
    line-height: 1.6;
    opacity: 0.8;
    font-size: 15px;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  padding: 20px 0;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 10px 0;
`;

export default PrivacyPolicy;
