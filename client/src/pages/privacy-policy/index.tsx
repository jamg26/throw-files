import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useHistory } from "react-router-dom";
import { Button, Card, CardBody, Text } from "../../components";
import styled from "styled-components";

const PrivacyPolicy = () => {
  const history = useHistory();

  return (
    <PolicyContainer>
      <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: "640px" }}>
          <Card style={{ marginBottom: "40px" }}>
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
                <Button 
                  variant="text" 
                  onClick={() => history.push("/")}
                  style={{ padding: 0, height: "auto", display: "flex", alignItems: "center", gap: "8px", opacity: 0.7 }}
                >
                  <ArrowLeft size={16} /> Back to Transfer
                </Button>

                <HeaderSection>
                  <ShieldCheck size={48} color="#7C3AED" style={{ marginBottom: "16px" }} />
                  <h1 style={{ margin: 0, color: "var(--text)", letterSpacing: "-1px", fontFamily: "'Inter', sans-serif" }}>
                    Privacy Policy
                  </h1>
                  <Text style={{ opacity: 0.6, color: "var(--text-muted)" }}>
                    Last Updated: February 17, 2026
                  </Text>
                </HeaderSection>

                <Divider />

                <Section>
                  <h3 style={{ color: "#7C3AED", fontFamily: "'Inter', sans-serif" }}>Our Philosophy</h3>
                  <p>
                    ThrowMyFile was built on the principle of absolute privacy. We believe that your data belongs to you, and your transfers should remain between you and your recipient. Our architecture is designed to facilitate direct communication without ever seeing, storing, or processing your files.
                  </p>
                </Section>

                <Section>
                  <h4 style={{ color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>1. Data Transmission (P2P)</h4>
                  <p>
                    ThrowMyFile utilizes Peer-to-Peer (P2P) technology. Files are streamed directly from your device to the receiver's device. Our servers act merely as a "signaling" service to help devices find each other and establish a connection. Once the transfer begins, the data does not pass through any intermediate cloud storage.
                  </p>
                </Section>

                <Section>
                  <h4 style={{ color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>2. Zero Data Storage</h4>
                  <p>
                    We do not maintain any databases. We do not store your files, metadata, filenames, or history on our servers. Your "Transfer History" is stored locally in your browser's session memory and is permanently cleared as soon as you close the tab or refresh the page.
                  </p>
                </Section>

                <Section>
                  <h4 style={{ color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>3. Tracking & Cookies</h4>
                  <p>
                    We value simplicity. ThrowMyFile does not use tracking cookies, analytics scripts, or third-party marketing pixels. We do not track your IP address or your geographical location.
                  </p>
                </Section>

                <Section>
                  <h4 style={{ color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>4. Security</h4>
                  <p>
                    While we provide the infrastructure for direct transfers, we recommend using encrypted channels for sensitive data. We utilize modern Web APIs to ensure the most secure connection possible between peers.
                  </p>
                </Section>

                <Section>
                  <h4 style={{ color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>5. Contact</h4>
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
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </PolicyContainer>
  );
};

const PolicyContainer = styled.div`
  min-height: 100vh;
  padding-top: 64px;
  
  p {
    line-height: 1.6;
    opacity: 0.8;
    font-size: 15px;
    color: var(--text);
    font-family: 'Inter', sans-serif;
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
  background: var(--border);
  margin: 10px 0;
`;

export default PrivacyPolicy;
