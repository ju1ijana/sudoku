import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/onest/300.css'
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
