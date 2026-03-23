import { Container, Row, Col, Image } from 'react-bootstrap'

function Hosts() {
  const Sparkle = () => (
    <span className="sparkle">✦</span>
  )

  return (
    <section id="hosts" className="py-5">
      <Container>
        <Row className="align-items-center">
          <Row>
            {/* Hosts Content */}
            <Col sm={12} lg={6} className='m-auto mt-4 mb-5 text-center'>
              <h2 
                className="fw-bold mb-3 align-items-center gap-2 d-flex justify-content-center"
                style={{ 
                  fontSize: '1.75rem', 
                  color: 'var(--sv-brown-dark)' 
                }}
              >
               <Sparkle /> Meet the Hosts <Sparkle />
              </h2>
              
              <p className="quote-text mb-3">
                "There is no shame<br />
                in healing out loud."
              </p>
              
              <p 
                style={{ 
                  fontSize: '1rem', 
                  color: 'var(--sv-brown-lighter)',
                  lineHeight: 1.7
                }}
              >
                We're two mujeres navigating growth, healing, and identity and 
                inviting you into the conversation.
              </p>
            </Col>
          </Row>
          {/* Host Images */}
          <Col sm={12} md={4} className='m-auto text-center'>
                  <Image src="/magdaheadshot.jpg" rounded className='img-fluid' />
                    <h4
                      className="fw-semibold mt-3"
                      style={{ 
                        color: 'var(--sv-brown-dark)'
                      }}
                    >
                      Magda
                    </h4>
                </Col>
              
              <Col sm={12} md={4} className='m-auto text-center'>
                  <Image src="/cruzheadshot.jpg" rounded className='img-fluid' />
                  <h4
                  className="fw-semibold mt-3"
                  style={{ 
                    color: 'var(--sv-brown-dark)'
                  }}
                >
                  Marycruz
                </h4>
                </Col>
        </Row>
      </Container>
    </section>
  )
}

export default Hosts
