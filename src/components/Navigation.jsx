import { Navbar, Nav, Container, Button, Image } from 'react-bootstrap'

function Navigation() {
  return (
    <Navbar expand="lg" className="py-3">
      <Container>
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2">
          
          <Image src="/sinlogo.jpeg" roundedCircle width={50} height={50} />
          <span className="display-text" style={{ fontSize: '24px' }}>Sin Vergüenza</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center gap-4">
            <Nav.Link href="/blog">Blog</Nav.Link>
            <Nav.Link href="/#episodes">Episodes</Nav.Link>
            <Nav.Link href="/#about">About</Nav.Link>
            <Nav.Link href="/#hosts">Hosts</Nav.Link>
            <Button 
              href="https://www.youtube.com/@sin.verguenzaa.podcast?sub_confirmation=1"
              target='_blank'
              variant="outline-dark" 
              className="rounded-pill px-4 py-2"
              style={{ 
                borderWidth: '2px',
                fontWeight: 600 
              }}
            >
              Subscribe
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default Navigation
