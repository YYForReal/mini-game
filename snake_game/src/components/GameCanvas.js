import React, { useEffect, useRef, useCallback } from 'react';
import { GAME_STATES } from '../game/gameLogic';

const GameCanvas = ({ game }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const render = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 性能优化：避免重复设置canvas尺寸
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 应用屏幕震动
    ctx.save();
    if (game.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * game.screenShake;
      const shakeY = (Math.random() - 0.5) * game.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 绘制背景（根据照明程度）
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    const illumination = Math.max(0, Math.min(1, game.backgroundIllumination || 0));
    bgGradient.addColorStop(0, `rgba(0, 0, 20, ${(1 - illumination * 0.8).toFixed(3)})`);
    bgGradient.addColorStop(0.5, `rgba(0, 10, 40, ${(1 - illumination * 0.6).toFixed(3)})`);
    bgGradient.addColorStop(1, `rgba(0, 0, 30, ${(1 - illumination * 0.7).toFixed(3)})`);

    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 性能优化：简化星空背景
    if (game.level <= 2) { // 仅在低等级绘制复杂星空
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 30; i++) { // 减少星星数量
        const x = (i * 137 + timestamp * 0.01 * (i % 3 + 1)) % width;
        const y = (i * 89 + timestamp * 0.005 * (i % 2 + 1)) % height;
        const size = Math.sin(timestamp * 0.001 + i) * 0.5 + 1;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 绘制光束（使用新的浮点坐标系统）
    if (game.beam.length > 0) {
      // 绘制光束主体（连接线）
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';

      ctx.beginPath();
      ctx.moveTo(game.beam[0].x, game.beam[0].y);

      for (let i = 1; i < game.beam.length; i++) {
        const segment = game.beam[i];
        ctx.lineTo(segment.x, segment.y);
      }
      ctx.stroke();

      // 性能优化：简化光束段渲染
      const segmentStep = game.level > 3 ? Math.floor(game.beam.length / 8) : 1; // 高等级跳过一些段
      game.beam.forEach((segment, index) => {
        if (segmentStep > 1 && index % segmentStep !== 0 && index < game.beam.length - 1) return;

        // 绘制轨迹 - 性能优化
        if (segment.trail && segment.trail.length > 1 && game.level <= 2) { // 仅在低等级绘制轨迹
          const trailIntensity = Math.max(0, Math.min(1, segment.intensity * 0.3));
          const lineWidth = Math.max(1, Math.min(20, segment.intensity * 6));
          ctx.strokeStyle = `rgba(100, 200, 255, ${trailIntensity.toFixed(3)})`;
          ctx.lineWidth = lineWidth;
          ctx.shadowBlur = 5; // 减少阴影模糊

          ctx.beginPath();
          ctx.moveTo(segment.trail[0].x, segment.trail[0].y);
          for (let j = 1; j < segment.trail.length; j++) {
            ctx.lineTo(segment.trail[j].x, segment.trail[j].y);
          }
          ctx.lineTo(segment.x, segment.y);
          ctx.stroke();
        }

        // 绘制段的光晕
        const glowRadius = game.level > 3 ? segment.radius * 1.5 : segment.radius * 2; // 高等级减少光晕
        const gradient = ctx.createRadialGradient(
          segment.x, segment.y, 0,
          segment.x, segment.y, glowRadius
        );
        const intensity = Math.max(0, Math.min(1, segment.intensity));
        const intensityHalf = Math.max(0, Math.min(1, intensity * 0.5));
        gradient.addColorStop(0, `rgba(100, 200, 255, ${intensity.toFixed(3)})`);
        gradient.addColorStop(0.5, `rgba(100, 200, 255, ${intensityHalf.toFixed(3)})`);
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制核心
        ctx.fillStyle = segment.color;
        ctx.shadowBlur = game.level > 3 ? 8 : 15; // 高等级减少阴影
        ctx.shadowColor = segment.color;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, segment.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 绘制光点
    game.orbs.forEach(orb => {
      if (!orb.collected || orb.collectAnimation < 1) {
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.getSize() * 2
        );
        // 直接使用固定的透明度值，避免字符串替换导致的格式错误
        const orbColor = orb.getColor();
        gradient.addColorStop(0, orbColor);
        gradient.addColorStop(0.7, orb.type === 'bonus' ? 'rgba(255, 215, 0, 0.5)' : 'rgba(100, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = orbColor;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.getSize(), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 恢复全局透明度
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 绘制护盾效果
    if (game.shieldActive) {
      game.beam.forEach((segment, index) => {
        if (index % 3 === 0) {
          const shieldGradient = ctx.createRadialGradient(
            segment.x, segment.y, 0,
            segment.x, segment.y, segment.radius * 3
          );
          shieldGradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
          shieldGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.2)');
          shieldGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

          ctx.fillStyle = shieldGradient;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, segment.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 绘制加速模式效果
    if (game.boostMode) {
      const head = game.beam && game.beam.length > 0 ? game.beam[0] : null;
      if (head && game.velocity && typeof game.velocity.x === 'number' && typeof game.velocity.y === 'number') {
        // 绘制速度线条
        for (let i = 0; i < 8; i++) {
          const angle = Math.atan2(-game.velocity.y, -game.velocity.x) + (Math.random() - 0.5) * 0.4;
          const length = 50 + Math.random() * 30;
          const startX = head.x + Math.cos(angle) * head.radius * 2;
          const startY = head.y + Math.sin(angle) * head.radius * 2;
          const endX = startX + Math.cos(angle) * length;
          const endY = startY + Math.sin(angle) * length;

          const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
          gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 200, 0, 0.6)';
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }

    // 性能优化：绘制粒子
    if (game.particles.length > 0) {
      // 性能优化：根据等级调整粒子渲染
      const particleStep = game.level > 4 ? 2 : 1; // 高等级跳过一些粒子渲染
      const maxRenderCount = game.level > 5 ? 50 : game.particles.length;

      for (let i = 0; i < Math.min(maxRenderCount, game.particles.length); i += particleStep) {
        const particle = game.particles[i];
        if (particle && particle.life > 0.1) { // 只渲染可见性较高的粒子
          particle.render(ctx);
        }
      }
    }

    // 游戏状态覆盖层
    if (game.gameState === GAME_STATES.READY) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('光影之线', width / 2, height / 2 - 40);

      ctx.font = '18px Arial';
      ctx.fillText('按任意方向键开始', width / 2, height / 2 + 10);
      ctx.fillText('收集光点，照亮世界', width / 2, height / 2 + 40);
    }

    if (game.gameState === GAME_STATES.PAUSED) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏暂停', width / 2, height / 2);

      ctx.font = '18px Arial';
      ctx.fillText('按空格键继续', width / 2, height / 2 + 40);
    }

    if (game.gameState === GAME_STATES.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏结束', width / 2, height / 2 - 60);

      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.fillText(`最终得分: ${game.score}`, width / 2, height / 2 - 10);

      ctx.font = '18px Arial';
      ctx.fillText('按 R 键重新开始', width / 2, height / 2 + 30);
    }

    // 恢复画布状态
    ctx.restore();

    animationFrameRef.current = requestAnimationFrame(render);
  }, [game]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        cursor: 'none'
      }}
    />
  );
};

export default GameCanvas;