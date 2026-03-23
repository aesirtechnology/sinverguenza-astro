import { Container, Row, Col, Button, Stack, Image } from 'react-bootstrap'
import { FaSpotify, FaMicrophone } from 'react-icons/fa'

function Hero() {
  return (
    <section className="py-5">
      <Container>
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <h1 
              className="fw-bold mb-3" 
              style={{ 
                fontSize: '3rem', 
                color: 'var(--sv-brown-dark)',
                lineHeight: 1.2
              }}
            >
              Sin Vergüenza
            </h1>
            <p 
              className="mb-4" 
              style={{ 
                fontSize: '1.125rem', 
                color: 'var(--sv-brown-light)',
                lineHeight: 1.7
              }}
            >
              A podcast about growth, healing, culture<br />
              & saying things out loud.
            </p>
            <Stack direction="horizontal" gap={3} className="flex-wrap">
              <Button 
              href="https://open.spotify.com/show/66OKRdoQvBTGuylGZv9yP1?si=dce918d974024ba4"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary" 
                className="d-flex align-items-center gap-2 px-4 py-3"
                style={{ 
                  background: 'var(--sv-gradient-button)',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(199, 91, 122, 0.3)'
                }}
              >
                <FaSpotify size={20} />
                Listen on Spotify
              </Button>
              <Button 
                href="#episodes"
                variant="outline-dark"
                className="d-flex align-items-center gap-2 px-4 py-3"
                style={{ 
                  borderRadius: '25px',
                  borderWidth: '2px',
                  borderColor: '#E8C4CE',
                  fontWeight: 600,
                  background: 'white'
                }}
              >
                <FaMicrophone size={18} />
                Latest Episode
              </Button>
            </Stack>
          </Col>
          <Col lg={4} md={3} sm={3} className="d-flex justify-content-center m-auto mt-4 image-fluid
          ">
            <Image src="/sinlogo.jpeg" roundedCircle />
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Hero
