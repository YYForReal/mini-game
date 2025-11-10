import { useEffect, useCallback } from 'react';
import { DIRECTIONS } from '../game/gameLogic';

const useGameControls = (game) => {
  const handleKeyDown = useCallback((event) => {
    // 防止默认行为
    event.preventDefault();

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        game.setDirection(DIRECTIONS.UP);
        if (game.gameState === 'ready') {
          game.start();
        }
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        game.setDirection(DIRECTIONS.DOWN);
        if (game.gameState === 'ready') {
          game.start();
        }
        break;

      case 'ArrowLeft':
      case 'a':
      case 'A':
        game.setDirection(DIRECTIONS.LEFT);
        if (game.gameState === 'ready') {
          game.start();
        }
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        game.setDirection(DIRECTIONS.RIGHT);
        if (game.gameState === 'ready') {
          game.start();
        }
        break;

      case ' ':
        game.pause();
        break;

      case 'r':
      case 'R':
        if (game.gameState === 'game_over') {
          game.restart();
        }
        break;

      case 'Escape':
        game.pause();
        break;

      case 'Enter':
        if (game.gameState === 'ready') {
          game.start();
        }
        break;

      case 'Shift':
        if (game.gameState === 'playing') {
          game.activateBoost();
        }
        break;

      case 'Control':
        if (game.gameState === 'playing') {
          game.activateShield();
        }
        break;

      case '1':
        if (game.gameState === 'playing') {
          game.activateBoost();
        }
        break;

      case '2':
        if (game.gameState === 'playing') {
          game.activateShield();
        }
        break;

      default:
        // 忽略其他按键
        break;
    }
  }, [game]);

  // 触摸控制 - 改进移动端体验
  const handleTouchStart = useCallback((event) => {
    if (game.gameState === 'ready') {
      game.start();
      return;
    }

    const touch = event.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    let moveStarted = false;

    const handleTouchMove = (moveEvent) => {
      moveEvent.preventDefault();
      const currentTouch = moveEvent.touches[0];
      const deltaX = currentTouch.clientX - startX;
      const deltaY = currentTouch.clientY - startY;

      // 降低移动阈值，提高响应性
      const threshold = 20;
      if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
        if (!moveStarted) {
          moveStarted = true;

          // 使用360度方向控制而不是4方向
          const angle = Math.atan2(deltaY, deltaX);
          game.setTargetAngle(angle);

          // 每100ms更新一次方向，避免过于频繁
          setTimeout(() => {
            moveStarted = false;
          }, 100);
        }

        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };

    const handleTouchEnd = () => {
      moveStarted = false;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [game]);

  // 双击暂停
  const handleTouchDoubleClick = useCallback((event) => {
    event.preventDefault();
    game.pause();
  }, [game]);

  // 鼠标控制（点击方向）
  const handleMouseDown = useCallback((event) => {
    if (game.gameState === 'ready') {
      game.start();
      return;
    }

    const rect = event.target.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const deltaX = clickX - centerX;
    const deltaY = clickY - centerY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      game.setDirection(deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
    } else {
      game.setDirection(deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
    }
  }, [game]);

  // 鼠标右键暂停
  const handleContextMenu = useCallback((event) => {
    event.preventDefault();
    game.pause();
  }, [game]);

  useEffect(() => {
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);

    // 触摸事件
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('dblclick', handleTouchDoubleClick);
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('contextmenu', handleContextMenu);
    }

    // 防止移动设备上的默认滚动行为
    document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('dblclick', handleTouchDoubleClick);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }

      document.removeEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    };
  }, [handleKeyDown, handleTouchStart, handleTouchDoubleClick, handleMouseDown, handleContextMenu]);

  // 游戏循环
  useEffect(() => {
    let animationFrameId;

    const gameLoop = (timestamp) => {
      game.update(timestamp);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [game]);

  return {
    // 可以在这里暴露一些控制方法给外部组件使用
    pause: () => game.pause(),
    restart: () => game.restart(),
    start: () => game.start()
  };
};

export default useGameControls;