import { Container, Row, Col, Card, Badge, Stack } from 'react-bootstrap'

function About() {
  const categories = ['Mental Health', 'Growth', 'Healing', 'Culture']
  
  return (
    <section id="about" className="py-5">
      <Container>
        <Row className="g-5 align-items-start">
          {/* About Text */}
          <Col lg={5}>
            <h2 className="section-title d-flex align-items-center gap-2">
              <span style={{ fontSize: '24px' }}>🦋</span>
              About the Podcast
            </h2>
            <p 
              style={{ 
                fontSize: '1rem', 
                lineHeight: 1.8, 
                color: 'var(--sv-brown-light)' 
              }}
            >
              Sin Vergüenza means without shame. Through real conversations and shared experiences, we talk about topics such as mental health, self sabotage, inner child healing, 
              spirituality, relationships, body image, and the unique experiences of growing up in first generation and immigrant families. <br/><br/>

              Our Podcast is a space created for honest, healing, and deep rooted conversations about what it means to grow, unlearn, 
              and come home to yourself. Sin Vergüenza means without shame.

            </p>
          </Col>
          
          {/* Featured Episode Card */}
          <Col lg={7}>
            <Card 
              className="border-0 p-4"
              style={{ 
                background: 'linear-gradient(135deg, #FFF5F8 0%, #FFE8EF 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(199, 91, 122, 0.1)',
                border: '1px solid #FFD4E0'
              }}
            >
              {/* Featured Image */}
             {/* <div 
                className="d-flex justify-content-center align-items-center mb-4"
                style={{ 
                  background: 'radial-gradient(circle at 50% 50%, #FFD4E0 0%, #FFBCD0 100%)',
                  borderRadius: '16px',
                  height: '180px'
                }}
              >
              </div> */}
              
              {/* Category Tags */}
              <Stack direction="horizontal" gap={2} className="flex-wrap mb-3">
                {categories.map((cat, index) => (
                  <Badge 
                    key={cat}
                    className="badge-category"
                    style={{
                      background: index === 0 ? 'var(--sv-pink-dark)' : 'white',
                      color: index === 0 ? 'white' : 'var(--sv-brown-light)',
                      border: index === 0 ? '1px solid var(--sv-pink-dark)' : '1px solid #E8C4CE',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontWeight: 500,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </Badge>
                ))}
              </Stack>
              
              {/* Episode Info */}
              <h3 
                className="fw-bold mb-2" 
                style={{ 
                  fontSize: '1.25rem', 
                  color: 'var(--sv-brown-dark)',
                  lineHeight: 1.4
                }}
              >
                Mental Health in Hispanic Families: The Conversations We Avoid
              </h3>
              <p 
                className="mb-0" 
                style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--sv-brown-lighter)' 
                }}
              >
                Why silence becomes survival — and how we start speaking anyway.
              </p>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default About
