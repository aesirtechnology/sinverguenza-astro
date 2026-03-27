import { Container, Stack } from 'react-bootstrap'
import { FaSpotify, FaInstagram, FaYoutube } from 'react-icons/fa'

function Footer() {
  const socialLinks = [
    { icon: FaYoutube, href: 'https://youtube.com/@sin.verguenzaa.podcast?si=ujbkLGoG3wiknkSh', label: 'YouTube' },
    { icon: FaSpotify, href: 'https://open.spotify.com/show/66OKRdoQvBTGuylGZv9yP1?si=e49966e8dd2a4e3a', label: 'Spotify' },
    { icon: FaInstagram, href: 'https://www.instagram.com/sin.verguenza.podcast?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', label: 'Instagram' },
  ]

  return (
    <footer className="py-5">
      <Container>
        <Stack 
          direction="horizontal" 
          gap={3} 
          className="justify-content-center"
        >
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="social-btn"
              target="_blank"
            >
              <Icon size={22} />
            </a>
          ))}
        </Stack>
        
        <p 
          className="text-center mt-4 mb-0"
          style={{ 
            fontSize: '14px', 
            color: 'var(--sv-brown-lighter)' 
          }}
        >
          © 2026 Sin Vergüenza Podcast. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}

export default Footer
