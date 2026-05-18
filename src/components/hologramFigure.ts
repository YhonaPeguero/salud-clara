/**
 * Ilustración SVG estilizada de una profesional médica.
 * Se rasteriza a textura y se monta sobre un plano con shader holográfico.
 * Mantén el SVG autocontenido para evitar assets externos.
 */
export const HOLOGRAM_FIGURE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="skin" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#ecfbff"/>
      <stop offset="55%" stop-color="#a8e3f5"/>
      <stop offset="100%" stop-color="#5dc1e2"/>
    </linearGradient>
    <linearGradient id="skinShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1a5a7a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#1a5a7a" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="hair" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#2a7798"/>
      <stop offset="100%" stop-color="#0b2a3d"/>
    </linearGradient>
    <linearGradient id="hairHi" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a4e8ff" stop-opacity="0"/>
      <stop offset="55%" stop-color="#a4e8ff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#a4e8ff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="coat" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#f6fdff"/>
      <stop offset="100%" stop-color="#b4e3f5"/>
    </linearGradient>
    <linearGradient id="coatShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1c5a7a" stop-opacity="0.45"/>
      <stop offset="50%" stop-color="#1c5a7a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1c5a7a" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="under" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#1a4a66"/>
      <stop offset="100%" stop-color="#091e2c"/>
    </linearGradient>
    <radialGradient id="cheek" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffb2c4" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffb2c4" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="300" cy="150" rx="155" ry="60" fill="#3aa0c8" opacity="0.18"/>

  <path d="
    M 178 250
    C 168 110, 295 88, 300 88
    C 305 88, 432 110, 422 250
    L 432 420
    C 438 455, 418 478, 392 470
    L 374 380
    L 226 380
    L 208 470
    C 182 478, 162 455, 168 420
    Z
  " fill="url(#hair)"/>
  <ellipse cx="300" cy="118" rx="62" ry="40" fill="url(#hair)"/>
  <ellipse cx="300" cy="118" rx="62" ry="40" fill="url(#hairHi)"/>

  <path d="M 268 388 L 270 452 Q 300 462 330 452 L 332 388 Z" fill="url(#skin)"/>
  <path d="M 270 438 Q 300 450 330 438 L 330 452 Q 300 462 270 452 Z" fill="#5fa6c3" opacity="0.5"/>

  <path d="
    M 198 260
    C 198 198, 240 158, 300 158
    C 360 158, 402 198, 402 260
    L 402 312
    C 402 372, 360 408, 300 408
    C 240 408, 198 372, 198 312
    Z
  " fill="url(#skin)"/>

  <path d="M 198 260 C 198 198, 240 158, 300 158 L 300 408 C 240 408, 198 372, 198 312 Z" fill="url(#skinShade)" opacity="0.6"/>

  <path d="
    M 200 250
    Q 215 175, 308 168
    Q 360 172, 388 220
    Q 370 198, 340 198
    L 270 200
    Q 230 208, 212 250
    Z
  " fill="url(#hair)"/>
  <path d="M 198 248 Q 188 308 206 360 L 222 354 Q 210 304 220 252 Z" fill="url(#hair)"/>
  <path d="M 402 248 Q 412 308 394 360 L 378 354 Q 390 304 380 252 Z" fill="url(#hair)"/>

  <path d="M 244 262 Q 262 254 284 263" stroke="#0a2a40" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M 316 263 Q 338 254 356 262" stroke="#0a2a40" stroke-width="4" fill="none" stroke-linecap="round"/>

  <path d="M 244 295 Q 263 286 286 295 Q 274 305 264 305 Q 253 304 244 295 Z" fill="#0a2a40"/>
  <path d="M 314 295 Q 337 286 356 295 Q 347 304 336 305 Q 326 305 314 295 Z" fill="#0a2a40"/>
  <circle cx="268" cy="294" r="2.8" fill="#dff7ff"/>
  <circle cx="340" cy="294" r="2.8" fill="#dff7ff"/>

  <path d="M 246 293 L 244 287" stroke="#0a2a40" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 284 293 L 286 287" stroke="#0a2a40" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 316 293 L 314 287" stroke="#0a2a40" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 354 293 L 356 287" stroke="#0a2a40" stroke-width="1.5" stroke-linecap="round"/>

  <path d="M 300 310 Q 296 342 304 350 Q 308 352 312 350" stroke="#1a5470" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.55"/>

  <ellipse cx="248" cy="345" rx="22" ry="12" fill="url(#cheek)"/>
  <ellipse cx="352" cy="345" rx="22" ry="12" fill="url(#cheek)"/>

  <path d="M 282 370 Q 300 380 318 370 Q 308 374 300 374 Q 292 374 282 370 Z" fill="#1a4862" opacity="0.85"/>
  <path d="M 280 371 Q 300 366 320 371" stroke="#0e3046" stroke-width="1.2" fill="none" opacity="0.6"/>

  <path d="
    M 80 800
    L 80 562
    Q 90 510 188 478
    L 235 470
    L 300 612
    L 365 470
    L 412 478
    Q 510 510 520 562
    L 520 800 Z
  " fill="url(#coat)"/>
  <path d="M 80 800 L 80 562 Q 90 510 188 478 L 188 800 Z" fill="url(#coatShade)" opacity="0.4"/>
  <path d="M 520 800 L 520 562 Q 510 510 412 478 L 412 800 Z" fill="url(#coatShade)" opacity="0.4"/>

  <path d="M 235 470 L 300 612 L 248 540 Z" fill="url(#coat)" stroke="#5cbedc" stroke-width="1.5"/>
  <path d="M 365 470 L 300 612 L 352 540 Z" fill="url(#coat)" stroke="#5cbedc" stroke-width="1.5"/>

  <path d="M 248 540 L 300 612 L 352 540 L 352 800 L 248 800 Z" fill="url(#under)"/>

  <path d="M 188 478 L 188 800" stroke="#5cbedc" stroke-width="1" opacity="0.4"/>
  <path d="M 412 478 L 412 800" stroke="#5cbedc" stroke-width="1" opacity="0.4"/>

  <circle cx="252" cy="466" r="7" fill="#7ff0ff" stroke="#bff7ff" stroke-width="1"/>
  <circle cx="348" cy="466" r="7" fill="#7ff0ff" stroke="#bff7ff" stroke-width="1"/>
  <path d="M 252 470 C 200 530, 196 610, 240 660 C 270 695, 300 710, 300 710" 
    fill="none" stroke="#7ff0ff" stroke-width="6" stroke-linecap="round"/>
  <path d="M 348 470 C 400 530, 404 610, 360 660 C 330 695, 300 710, 300 710" 
    fill="none" stroke="#7ff0ff" stroke-width="6" stroke-linecap="round"/>
  <circle cx="300" cy="722" r="34" fill="#0a2c40" stroke="#7ff0ff" stroke-width="6"/>
  <circle cx="300" cy="722" r="22" fill="#7ff0ff" opacity="0.35"/>
  <circle cx="300" cy="722" r="9" fill="#dff7ff"/>

  <g transform="translate(420 555)">
    <circle cx="0" cy="0" r="18" fill="#f4faff" stroke="#ff6376" stroke-width="2"/>
    <rect x="-3" y="-11" width="6" height="22" fill="#ff6376"/>
    <rect x="-11" y="-3" width="22" height="6" fill="#ff6376"/>
  </g>

  <rect x="170" y="555" width="14" height="4" fill="#7ff0ff" opacity="0.6"/>
  <rect x="170" y="563" width="22" height="3" fill="#7ff0ff" opacity="0.4"/>

  <path d="
    M 198 260
    C 198 198, 240 158, 300 158
    C 360 158, 402 198, 402 260
    L 402 312
    C 402 372, 360 408, 300 408
    C 240 408, 198 372, 198 312
    Z
  " fill="none" stroke="#d6f4ff" stroke-width="1.2" opacity="0.55"/>
</svg>`
