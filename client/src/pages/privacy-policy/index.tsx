import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useHistory } from "react-router-dom";
import { Button, Card, CardBody } from "../../components";
import styled from "styled-components";

const LAST_UPDATED = "August 5, 2026";

const PrivacyPolicy = () => {
  const history = useHistory();

  return (
    <PolicyContainer>
      <Layout>
        <Card>
          <CardBody>
            <Stack>
              <Button
                variant="text"
                onClick={() => history.push("/")}
                style={{ padding: 0, height: "auto", alignSelf: "flex-start" }}
              >
                <ArrowLeft size={16} /> Back to Transfer
              </Button>

              <PageHeader>
                <ShieldCheck size={48} color="var(--accent-primary)" />
                <h1>Privacy Policy</h1>
                <UpdatedAt>Last updated: {LAST_UPDATED}</UpdatedAt>
              </PageHeader>

              <Divider />

              <Section>
                <h2>How ThrowMyFile works</h2>
                <p>
                  ThrowMyFile moves a file from one browser to another without
                  ever saving it. When you send a file, your browser slices it
                  into chunks and streams them over a WebSocket to our
                  Cloudflare Worker, which immediately forwards each chunk to
                  the other devices connected to the same channel code.
                </p>
                <p>
                  Chunks are held in memory only for as long as it takes to
                  forward them. Nothing is written to disk, to a database, or to
                  any object storage — there is no copy of your file to delete
                  afterwards, and nothing to hand over if someone asks.
                </p>
              </Section>

              <Section>
                <h2>What this is not</h2>
                <p>
                  We want to be precise, because plenty of tools in this space
                  are not. ThrowMyFile is a <strong>relay</strong>, not a
                  direct peer-to-peer connection, and it is{" "}
                  <strong>not end-to-end encrypted</strong>. There is no WebRTC
                  and no client-side encryption: your file travels over TLS to
                  our Worker, is decrypted there in order to be forwarded, and
                  is re-encrypted over TLS on its way to the recipient.
                </p>
                <p>
                  In practice that means our infrastructure is technically
                  capable of observing the bytes passing through it. We do not
                  log or inspect them, but you should not take that on trust for
                  material that genuinely requires secrecy. For anything
                  sensitive, encrypt the file yourself before sending it — an
                  encrypted archive with a password shared over a different
                  channel is enough.
                </p>
              </Section>

              <Section>
                <h2>What we store</h2>
                <p>
                  On our servers: nothing. We run no database and keep no logs
                  of files, filenames, channel codes, or IP addresses.
                </p>
                <p>
                  In your browser: your transfer history lives in memory for the
                  lifetime of the tab and disappears when you close or reload
                  it. Your light/dark theme preference is saved in{" "}
                  <code>localStorage</code> so the site does not flash the wrong
                  colours on your next visit. That is the only thing we persist,
                  and it never leaves your device.
                </p>
              </Section>

              <Section>
                <h2>Third parties</h2>
                <p>
                  The site is served by Cloudflare Pages and the relay runs on
                  Cloudflare Workers, so Cloudflare processes your connection as
                  our infrastructure provider. Beyond that there is nothing: no
                  analytics, no tracking cookies, no advertising scripts, and no
                  third-party fonts or CDNs. Every asset the page loads comes
                  from our own domain.
                </p>
              </Section>

              <Section>
                <h2>Channel codes</h2>
                <p>
                  A channel code is the only thing protecting a transfer. Anyone
                  who knows the code and is connected at the same time can
                  receive what you send, so treat it like a password: share it
                  over a channel you trust, and generate a fresh one when you
                  are done. Received files are never written to your disk
                  automatically — you always choose whether to save them.
                </p>
              </Section>

              <Section>
                <h2>Contact</h2>
                <p>
                  ThrowMyFile is open source, so you can verify all of the above
                  by reading the code rather than taking our word for it. If
                  something here does not match what you find, that is a bug and
                  we want to hear about it — open an issue on{" "}
                  <PolicyLink
                    href="https://github.com/jamg26/throw-files"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </PolicyLink>{" "}
                  or email{" "}
                  <PolicyLink href="mailto:jammmg26@gmail.com">
                    jammmg26@gmail.com
                  </PolicyLink>
                  .
                </p>
              </Section>

              <Divider />

              <Colophon>
                ThrowMyFile &copy; {new Date().getFullYear()} · Direct. Private.
                Nothing stored.
              </Colophon>
            </Stack>
          </CardBody>
        </Card>
      </Layout>
    </PolicyContainer>
  );
};

const PolicyContainer = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: 56px;
`;

const Layout = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;

  > * {
    width: 100%;
    max-width: 680px;
  }

  @media (max-width: 480px) {
    padding: 24px 12px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const PageHeader = styled.header`
  text-align: center;
  padding: 12px 0;

  svg {
    margin-bottom: 16px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: clamp(26px, 6vw, 32px);
    letter-spacing: -1px;
    color: var(--text-primary);
  }
`;

const UpdatedAt = styled.p`
  margin: 0;
  font-size: 13px;
  /* Was --text-muted at 0.6 opacity inside a 0.5-opacity wrapper: roughly 0.3
     effective, far below any readable contrast ratio. */
  color: var(--text-tertiary);
`;

const Section = styled.section`
  h2 {
    margin: 0 0 10px;
    font-size: 17px;
    font-weight: 700;
    color: var(--accent-primary);
  }

  p {
    margin: 0 0 12px;
    line-height: 1.7;
    font-size: 15px;
    color: var(--text-secondary);

    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    color: var(--text-primary);
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
  }
`;

const PolicyLink = styled.a`
  color: var(--accent-primary);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
    border-radius: 3px;
  }
`;

const Divider = styled.hr`
  height: 1px;
  border: none;
  background: var(--border-subtle);
  margin: 0;
`;

const Colophon = styled.p`
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  padding-bottom: 8px;
`;

export default PrivacyPolicy;
