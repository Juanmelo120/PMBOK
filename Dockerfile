# Gestor PMBOK 8 — imagen del backend (sirve también la interfaz estática)
# Compilar desde la raíz del repositorio: docker build -t pmbok8 .
FROM node:20-alpine

WORKDIR /app

# Instala primero solo las dependencias para aprovechar la caché de capas
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --omit=dev

# Copia el resto: la interfaz (index.html + assets) y el backend completo
COPY index.html ./index.html
COPY assets ./assets
COPY backend ./backend

WORKDIR /app/backend

# Dentro de un contenedor hay que escuchar en todas las interfaces: por
# defecto el servidor solo atiende al bucle local y nadie lo alcanzaría.
# El puerto lo fija quien despliega (PORT); 3000 es el valor por defecto.
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "src/servidor.js"]
