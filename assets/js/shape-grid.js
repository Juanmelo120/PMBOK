/* ═══════════════════════════════════════════════════════════
   shape-grid.js — Rejilla animada de fondo (ShapeGrid)
   ───────────────────────────────────────────────────────────
   Adaptación a JavaScript sin dependencias del componente
   <ShapeGrid /> de React Bits (https://reactbits.dev), variante
   JavaScript + CSS. La aplicación no usa React ni compilación y
   debe abrirse sin conexión, así que se conservan las mismas
   opciones y el mismo dibujo en canvas, con estos ajustes:
   · nitidez en pantallas de alta densidad (devicePixelRatio)
   · ResizeObserver en lugar de «resize»: el panel cambia de alto
     (abrir el formulario, añadir proyectos) sin que cambie la ventana
   · el puntero se escucha en un anfitrión, de modo que el lienzo
     puede ir detrás de las tarjetas sin robarles los clics
   · los colores se pueden cambiar en caliente para seguir el tema
   · con «reducir movimiento» la rejilla no se desplaza
   · el desplazamiento se puede recuperar al volver a montarla
   ═══════════════════════════════════════════════════════════ */

window.ShapeGrid = (function () {
  'use strict';

  /* opciones: direction, speed, borderColor, squareSize, hoverFillColor,
     shape, hoverTrailAmount (las del componente original) y además
     anfitrion (elemento que recibe el puntero) y desplazamiento {x, y} */
  function crear(canvas, opciones) {
    opciones = opciones || {};
    var direction = opciones.direction || 'right';
    var speed = opciones.speed === undefined ? 1 : opciones.speed;
    var borderColor = opciones.borderColor || '#999';
    var squareSize = opciones.squareSize || 40;
    var hoverFillColor = opciones.hoverFillColor || '#222';
    var shape = opciones.shape || 'square';
    var hoverTrailAmount = opciones.hoverTrailAmount || 0;
    var anfitrion = opciones.anfitrion || canvas;

    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducido) direction = 'none';

    var ctx = canvas.getContext('2d');
    var requestRef = null;
    var gridOffset = { x: 0, y: 0 };
    if (opciones.desplazamiento) {
      gridOffset.x = opciones.desplazamiento.x || 0;
      gridOffset.y = opciones.desplazamiento.y || 0;
    }
    var hoveredSquare = null;
    var trailCells = [];
    var cellOpacities = new Map();
    var ancho = 0, alto = 0;

    var isHex = shape === 'hexagon';
    var isTri = shape === 'triangle';
    var hexHoriz = squareSize * 1.5;
    var hexVert = squareSize * Math.sqrt(3);

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = canvas.offsetWidth;
      alto = canvas.offsetHeight;
      canvas.width = Math.max(1, Math.round(ancho * dpr));
      canvas.height = Math.max(1, Math.round(alto * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 1;
    }

    var observadorTamano = window.ResizeObserver ? new ResizeObserver(resizeCanvas) : null;
    if (observadorTamano) observadorTamano.observe(canvas);
    else window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawHex(cx, cy, size) {
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var angle = (Math.PI / 3) * i;
        var vx = cx + size * Math.cos(angle);
        var vy = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    }

    function drawCircle(cx, cy, size) {
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.closePath();
    }

    function drawTriangle(cx, cy, size, flip) {
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(cx, cy + size / 2);
        ctx.lineTo(cx + size / 2, cy - size / 2);
        ctx.lineTo(cx - size / 2, cy - size / 2);
      } else {
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
      }
      ctx.closePath();
    }

    function drawGrid() {
      ctx.clearRect(0, 0, ancho, alto);
      var col, row, cellKey, alpha, cols, rows, offsetX, offsetY;

      if (isHex) {
        var colShiftH = Math.floor(gridOffset.x / hexHoriz);
        offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
        offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
        cols = Math.ceil(ancho / hexHoriz) + 3;
        rows = Math.ceil(alto / hexVert) + 3;

        for (col = -2; col < cols; col++) {
          for (row = -2; row < rows; row++) {
            var hx = col * hexHoriz + offsetX;
            var hy = row * hexVert + ((col + colShiftH) % 2 !== 0 ? hexVert / 2 : 0) + offsetY;
            cellKey = col + ',' + row;
            alpha = cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawHex(hx, hy, squareSize);
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawHex(hx, hy, squareSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (isTri) {
        var halfW = squareSize / 2;
        var colShiftT = Math.floor(gridOffset.x / halfW);
        var rowShiftT = Math.floor(gridOffset.y / squareSize);
        offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        cols = Math.ceil(ancho / halfW) + 4;
        rows = Math.ceil(alto / squareSize) + 4;

        for (col = -2; col < cols; col++) {
          for (row = -2; row < rows; row++) {
            var tx = col * halfW + offsetX;
            var ty = row * squareSize + squareSize / 2 + offsetY;
            var flip = ((col + colShiftT + row + rowShiftT) % 2 + 2) % 2 !== 0;
            cellKey = col + ',' + row;
            alpha = cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawTriangle(tx, ty, squareSize, flip);
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawTriangle(tx, ty, squareSize, flip);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else if (shape === 'circle') {
        offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        cols = Math.ceil(ancho / squareSize) + 3;
        rows = Math.ceil(alto / squareSize) + 3;

        for (col = -2; col < cols; col++) {
          for (row = -2; row < rows; row++) {
            var ccx = col * squareSize + squareSize / 2 + offsetX;
            var ccy = row * squareSize + squareSize / 2 + offsetY;
            cellKey = col + ',' + row;
            alpha = cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              drawCircle(ccx, ccy, squareSize);
              ctx.fillStyle = hoverFillColor;
              ctx.fill();
              ctx.globalAlpha = 1;
            }
            drawCircle(ccx, ccy, squareSize);
            ctx.strokeStyle = borderColor;
            ctx.stroke();
          }
        }
      } else {
        offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        cols = Math.ceil(ancho / squareSize) + 3;
        rows = Math.ceil(alto / squareSize) + 3;

        for (col = -2; col < cols; col++) {
          for (row = -2; row < rows; row++) {
            var sx = col * squareSize + offsetX;
            var sy = row * squareSize + offsetY;
            cellKey = col + ',' + row;
            alpha = cellOpacities.get(cellKey);
            if (alpha) {
              ctx.globalAlpha = alpha;
              ctx.fillStyle = hoverFillColor;
              ctx.fillRect(sx, sy, squareSize, squareSize);
              ctx.globalAlpha = 1;
            }
            ctx.strokeStyle = borderColor;
            ctx.strokeRect(sx, sy, squareSize, squareSize);
          }
        }
      }
      /* El original cierra con un degradado radial de una sola parada
         transparente, que no pinta nada: aquí el viñeteado lo hace una
         máscara CSS en el contenedor. */
    }

    function updateAnimation() {
      var effectiveSpeed = Math.max(speed, 0.1);
      var wrapX = isHex ? hexHoriz * 2 : squareSize;
      var wrapY = isHex ? hexVert : isTri ? squareSize * 2 : squareSize;

      switch (direction) {
        case 'right':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
          break;
        case 'left':
          gridOffset.x = (gridOffset.x + effectiveSpeed + wrapX) % wrapX;
          break;
        case 'up':
          gridOffset.y = (gridOffset.y + effectiveSpeed + wrapY) % wrapY;
          break;
        case 'down':
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
          break;
        case 'diagonal':
          gridOffset.x = (gridOffset.x - effectiveSpeed + wrapX) % wrapX;
          gridOffset.y = (gridOffset.y - effectiveSpeed + wrapY) % wrapY;
          break;
        default:
          break;
      }

      updateCellOpacities();
      drawGrid();
      requestRef = requestAnimationFrame(updateAnimation);
    }

    function updateCellOpacities() {
      var targets = new Map();

      if (hoveredSquare) targets.set(hoveredSquare.x + ',' + hoveredSquare.y, 1);

      if (hoverTrailAmount > 0) {
        for (var i = 0; i < trailCells.length; i++) {
          var t = trailCells[i];
          var key = t.x + ',' + t.y;
          if (!targets.has(key)) {
            targets.set(key, (trailCells.length - i) / (trailCells.length + 1));
          }
        }
      }

      targets.forEach(function (_, k) {
        if (!cellOpacities.has(k)) cellOpacities.set(k, 0);
      });

      cellOpacities.forEach(function (opacity, k) {
        var target = targets.get(k) || 0;
        var next = opacity + (target - opacity) * 0.15;
        if (next < 0.005) cellOpacities.delete(k);
        else cellOpacities.set(k, next);
      });
    }

    function marcarCelda(col, row) {
      if (!hoveredSquare || hoveredSquare.x !== col || hoveredSquare.y !== row) {
        if (hoveredSquare && hoverTrailAmount > 0) {
          trailCells.unshift({ x: hoveredSquare.x, y: hoveredSquare.y });
          if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
        }
        hoveredSquare = { x: col, y: row };
      }
    }

    function handleMouseMove(event) {
      var rect = canvas.getBoundingClientRect();
      var mouseX = event.clientX - rect.left;
      var mouseY = event.clientY - rect.top;
      var offsetX, offsetY, adjustedX, adjustedY;

      if (mouseX < 0 || mouseY < 0 || mouseX > rect.width || mouseY > rect.height) {
        handleMouseLeave();
        return;
      }

      if (isHex) {
        var colShift = Math.floor(gridOffset.x / hexHoriz);
        offsetX = ((gridOffset.x % hexHoriz) + hexHoriz) % hexHoriz;
        offsetY = ((gridOffset.y % hexVert) + hexVert) % hexVert;
        adjustedX = mouseX - offsetX;
        adjustedY = mouseY - offsetY;
        var colH = Math.round(adjustedX / hexHoriz);
        var rowOffset = (colH + colShift) % 2 !== 0 ? hexVert / 2 : 0;
        marcarCelda(colH, Math.round((adjustedY - rowOffset) / hexVert));
      } else if (isTri) {
        var halfW = squareSize / 2;
        offsetX = ((gridOffset.x % halfW) + halfW) % halfW;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        adjustedX = mouseX - offsetX;
        adjustedY = mouseY - offsetY;
        marcarCelda(Math.round(adjustedX / halfW), Math.floor(adjustedY / squareSize));
      } else if (shape === 'circle') {
        offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        adjustedX = mouseX - offsetX;
        adjustedY = mouseY - offsetY;
        marcarCelda(Math.round(adjustedX / squareSize), Math.round(adjustedY / squareSize));
      } else {
        offsetX = ((gridOffset.x % squareSize) + squareSize) % squareSize;
        offsetY = ((gridOffset.y % squareSize) + squareSize) % squareSize;
        adjustedX = mouseX - offsetX;
        adjustedY = mouseY - offsetY;
        marcarCelda(Math.floor(adjustedX / squareSize), Math.floor(adjustedY / squareSize));
      }
    }

    function handleMouseLeave() {
      if (hoveredSquare && hoverTrailAmount > 0) {
        trailCells.unshift({ x: hoveredSquare.x, y: hoveredSquare.y });
        if (trailCells.length > hoverTrailAmount) trailCells.length = hoverTrailAmount;
      }
      hoveredSquare = null;
    }

    anfitrion.addEventListener('mousemove', handleMouseMove);
    anfitrion.addEventListener('mouseleave', handleMouseLeave);

    var isVisible = false;
    var isPageVisible = !document.hidden;

    function tryStart() {
      if (isVisible && isPageVisible && !requestRef) {
        requestRef = requestAnimationFrame(updateAnimation);
      }
    }
    function tryStop() {
      if (requestRef) {
        cancelAnimationFrame(requestRef);
        requestRef = null;
      }
    }

    var io = new IntersectionObserver(function (entradas) {
      isVisible = entradas[0].isIntersecting;
      if (isVisible) tryStart(); else tryStop();
    }, { threshold: 0 });
    io.observe(canvas);

    function onVisibility() {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart(); else tryStop();
    }
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();
    drawGrid();

    return {
      /* Cambia los colores sin reiniciar la animación (cambio de tema) */
      colores: function (borde, relleno) {
        if (borde) borderColor = borde;
        if (relleno) hoverFillColor = relleno;
        if (!requestRef) drawGrid();
      },
      desplazamiento: function () { return { x: gridOffset.x, y: gridOffset.y }; },
      destruir: function () {
        tryStop();
        io.disconnect();
        if (observadorTamano) observadorTamano.disconnect();
        else window.removeEventListener('resize', resizeCanvas);
        document.removeEventListener('visibilitychange', onVisibility);
        anfitrion.removeEventListener('mousemove', handleMouseMove);
        anfitrion.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }

  return { crear: crear };
})();
