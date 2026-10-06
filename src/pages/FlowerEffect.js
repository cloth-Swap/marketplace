import React, { useEffect, useRef } from "react";

function FlowerEffect() {
  const canvasRef = useRef(null);

  useEffect(function () {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const parent = canvas.parentElement;

    if (!parent) return;

    let animationFrame;
    let width = 0;
    let height = 0;

    const flowers = [];

    const flowerCount =
      window.innerWidth <= 767 ? 38 : 78;

    const mouse = {
      x: -1000,
      y: -1000,
      active: false
    };

    function resizeCanvas() {
      const rect = parent.getBoundingClientRect();

      const newWidth = rect.width;
const newHeight = rect.height;

if (newWidth <= 0 || newHeight <= 0) {
  return;
}

const oldWidth = width;
const oldHeight = height;

width = newWidth;
height = newHeight;

if (
  oldWidth > 0 &&
  oldHeight > 0
) {
  flowers.forEach(function (flower) {
    flower.x =
      (flower.x / oldWidth) * newWidth;

    flower.y =
      (flower.y / oldHeight) * newHeight;
  });
}
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.round(
        width * pixelRatio
      );

      canvas.height = Math.round(
        height * pixelRatio
      );

      canvas.style.width = width + "px";
      canvas.style.height = height + "px";

      ctx.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0
      );
    }

    function createFlower() {
      const isLarge = Math.random() < 0.16;
      const isSmall = Math.random() < 0.35;

      let size;

      if (isLarge) {
        size = Math.random() * 4 + 7;
      } else if (isSmall) {
        size = Math.random() * 2 + 2;
      } else {
        size = Math.random() * 3 + 3.5;
      }

      return {
        x: Math.random() * width,
        y: Math.random() * height,

        size: size,

        speedX:
          (Math.random() - 0.5) * 0.22,

        speedY:
          (Math.random() - 0.5) * 0.18,

        rotation:
          Math.random() * Math.PI * 2,

        rotationSpeed:
          (Math.random() - 0.5) * 0.009,

        opacity:
          Math.random() * 0.35 + 0.35,

        pulse:
          Math.random() * Math.PI * 2,

        pulseSpeed:
          Math.random() * 0.018 + 0.008,

        petalColor:
          Math.random() < 0.5
            ? "rgba(205, 133, 190, 0.65)"
            : "rgba(236, 164, 210, 0.62)",

        centerColor:
          Math.random() < 0.5
            ? "rgba(250, 190, 220, 0.9)"
            : "rgba(220, 145, 205, 0.85)"
      };
    }

    function resetFlowers() {
      flowers.length = 0;

      for (let i = 0; i < flowerCount; i++) {
        flowers.push(createFlower());
      }
    }

    function keepFlowerInside(flower) {
      if (flower.x < -30) {
        flower.x = width + 30;
      }

      if (flower.x > width + 30) {
        flower.x = -30;
      }

      if (flower.y < -30) {
        flower.y = height + 30;
      }

      if (flower.y > height + 30) {
        flower.y = -30;
      }
    }

    function drawFlower(flower) {
      ctx.save();

      ctx.translate(
        flower.x,
        flower.y
      );

      ctx.rotate(
        flower.rotation
      );

      const pulseSize =
        flower.size +
        Math.sin(flower.pulse) * 0.6;

      ctx.globalAlpha =
        flower.opacity;

      ctx.shadowBlur = 12;

      ctx.shadowColor =
        "rgba(190, 105, 185, 0.35)";

      for (let i = 0; i < 5; i++) {
        ctx.rotate(
          (Math.PI * 2) / 5
        );

        ctx.beginPath();

        ctx.ellipse(
          0,
          -pulseSize,
          pulseSize * 0.52,
          pulseSize,
          0,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          flower.petalColor;

        ctx.fill();
      }

      ctx.beginPath();

      ctx.arc(
        0,
        0,
        pulseSize * 0.34,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        flower.centerColor;

      ctx.fill();

      ctx.restore();
    }

    function updateFlower(flower) {
      flower.x += flower.speedX;
      flower.y += flower.speedY;

      flower.rotation +=
        flower.rotationSpeed;

      flower.pulse +=
        flower.pulseSpeed;

      if (mouse.active) {
        const dx =
          flower.x - mouse.x;

        const dy =
          flower.y - mouse.y;

        const distance =
          Math.sqrt(
            dx * dx + dy * dy
          );

        const interactionRadius = 145;

        if (
          distance <
            interactionRadius &&
          distance > 0
        ) {
          const force =
            (interactionRadius -
              distance) /
            interactionRadius;

          flower.x +=
            (dx / distance) *
            force *
            0.9;

          flower.y +=
            (dy / distance) *
            force *
            0.9;
        }
      }

      keepFlowerInside(flower);
    }

    function animate() {
      if (width <= 0 || height <= 0) {
        animationFrame =
          requestAnimationFrame(
            animate
          );

        return;
      }

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      flowers.forEach(
        function (flower) {
          updateFlower(flower);
          drawFlower(flower);
        }
      );

      animationFrame =
        requestAnimationFrame(
          animate
        );
    }

    function handleMouseMove(event) {
      const rect =
        canvas.getBoundingClientRect();

      mouse.x =
        event.clientX - rect.left;

      mouse.y =
        event.clientY - rect.top;

      mouse.active = true;
    }

    function handleMouseLeave() {
      mouse.active = false;
    }

    resizeCanvas();

    resetFlowers();

    animate();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    parent.addEventListener(
      "mousemove",
      handleMouseMove
    );

    parent.addEventListener(
      "mouseleave",
      handleMouseLeave
    );

    const resizeObserver =
      new ResizeObserver(
        function () {
          resizeCanvas();
        }
      );

    resizeObserver.observe(parent);

    return function () {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resizeCanvas
      );

      parent.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      parent.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );

      resizeObserver.disconnect();
    };
  }, []);

  return React.createElement(
    "canvas",
    {
      ref: canvasRef,
      className:
        "clothswap-flower-effect",
      "aria-hidden": "true"
    }
  );
}

export default FlowerEffect;