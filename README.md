# MiniLearn Teams Web

Landing estatica para `MiniLearn Teams`.

## Estructura

- `index.html`
- `styles.css`
- `main.js`

## Preview local

Puedes levantarla con cualquier servidor estatico. Por ejemplo:

```bash
cd /Users/kupa/Projects/minilearn/teams-web
python3 -m http.server 4173
```

Luego abre:

- `http://localhost:4173`

## Deploy en Cloudflare Pages

Como este sitio es estatico, puedes desplegarlo sin build step:

- Framework preset: `None`
- Build command: vacio
- Build output directory: `/`

Si prefieres conectarlo via Git:

1. Crea un repo para esta carpeta o muevela a un repo propio.
2. Conecta el repo a Cloudflare Pages.
3. Configura el custom domain:
   - `teams.minilearn.app`

## Siguientes mejoras sugeridas

- agregar formulario o CTA real en lugar de `mailto:`
- agregar analytics
- agregar pagina separada de pricing
- agregar pagina de demo
