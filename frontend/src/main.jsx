import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* The fonts are bundled and served from our own origin. Fetching them from
   Google sent every visitor's IP address to Google, which a German court ruled
   a GDPR breach (LG München I, 3 O 17493/20). Same weights as before; italics
   are still drawn by the browser, as they were. */
import '@fontsource/bebas-neue/400.css'
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
