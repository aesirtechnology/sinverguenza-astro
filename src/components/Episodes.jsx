import { Container, Row, Col, Card } from 'react-bootstrap'

// Replace these with your actual Spotify episode IDs
// To get an episode ID: Spotify → Episode → ••• → Share → Copy Episode Link
// The ID is the part after /episode/ (e.g., https://open.spotify.com/episode/ABC123 → ABC123)
const episodes = [
  {
    id: 1,
    spotifyId: '0CZbjAWiBQv7LYOdcoxGoy',
  },
  {
    id: 2,
    spotifyId: '4Ilynap55CtPkJgxwiMSCb',
  },
  {
    id: 3,
    spotifyId: '4J82F7IZE8n6f0HFIwCRwB',
  }
]

function Episodes() {
  const Sparkle = () => (
    <span className="sparkle">✦</span>
  )

  return (
    <section id="episodes" className="py-5">
      <Container>
        {/* Section Title */}
        <h2 
          className="text-center fw-bold mb-5 d-flex justify-content-center align-items-center gap-3"
          style={{ fontSize: '2rem', color: 'var(--sv-brown-dark)' }}
        >
          <Sparkle /> Latest Episodes <Sparkle />
        </h2>
        
        {/* Episode Cards with Spotify Embeds */}
        <Row className="g-4">
          {episodes.map(episode => (
            <Col key={episode.id} md={6} lg={4} sm={12}>
              <div className="h-100 border-0 p-2">
                  <iframe 
                    src={`https://open.spotify.com/embed/episode/${episode.spotifyId}?utm_source=generator&theme=1`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={episode.title}
                    style={{ borderRadius: '12px', border: 'none' }}
                  />
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default Episodes


