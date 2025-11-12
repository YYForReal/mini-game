import React, { useState, useEffect, useRef } from 'react';
import { LightBeamGame } from './game/gameLogic';
import GameCanvas from './components/GameCanvas';
// import GameHUD from './components/GameHUD'; // Temporarily disabled due to JSX parsing issues
import useGameControls from './hooks/useGameControls';
import './App.css';

function App() {
  const gameRef = useRef(new LightBeamGame());
  const game = gameRef.current;

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState(game.gameState);
  // const [backgroundIllumination, setBackgroundIllumination] = useState(0); // Removed - unused

  // 使用游戏控制钩子
  useGameControls(game);

  // 监听游戏状态变化
  useEffect(() => {
    const updateGameState = () => {
      setScore(game.score);
      setLevel(game.level);
      setGameState(game.gameState);
      // setBackgroundIllumination(game.backgroundIllumination); // Removed - unused
    };

    // 初始状态更新
    updateGameState();

    // 定期更新状态
    const interval = setInterval(updateGameState, 50);

    return () => clearInterval(interval);
  }, [game]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      game.reset();
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [game]);

  return (
    <div className="App">
      <GameCanvas game={game} />

      {/* Enhanced Simple HUD with better styling */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontSize: '18px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '15px 20px',
        borderRadius: '12px',
        border: '2px solid rgba(100, 200, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(100, 200, 255, 0.3)',
        fontFamily: 'monospace',
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '8px', color: 'rgba(100, 200, 255, 0.9)', fontWeight: 'bold' }}>
          光影之线
        </div>
        <div>得分: {score}</div>
        <div>等级: {level}</div>
        <div>能量: {Math.floor(game.energy)}/{game.maxEnergy}</div>
        {game.combo > 0 && (
          <div style={{ color: '#ff64a0', fontWeight: 'bold' }}>
            连击: {game.combo}x
          </div>
        )}
        {game.boostMode && (
          <div style={{ color: '#ffc800', fontWeight: 'bold' }}>
            ⚡ 加速中
          </div>
        )}
        {game.shieldActive && (
          <div style={{ color: '#00ff88', fontWeight: 'bold' }}>
            🛡 护盾激活
          </div>
        )}
      </div>

      {/* Ability Buttons */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <button
          onClick={() => game.activateBoost()}
          disabled={game.energy < 30 || game.boostMode}
          style={{
            padding: '10px 15px',
            background: game.boostMode ? 'rgba(0, 255, 100, 0.3)' : 'rgba(0, 0, 0, 0.7)',
            border: `2px solid ${game.boostMode ? 'rgba(0, 255, 100, 0.8)' : 'rgba(100, 200, 255, 0.5)'}`,
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: game.energy < 30 || game.boostMode ? 'not-allowed' : 'pointer',
            opacity: game.energy < 30 || game.boostMode ? 0.5 : 1,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            fontFamily: 'monospace'
          }}
        >
          ⚡ 加速 (30能量)
        </button>

        <button
          onClick={() => game.activateShield()}
          disabled={game.energy < 20 || game.shieldActive}
          style={{
            padding: '10px 15px',
            background: game.shieldActive ? 'rgba(0, 255, 100, 0.3)' : 'rgba(0, 0, 0, 0.7)',
            border: `2px solid ${game.shieldActive ? 'rgba(0, 255, 100, 0.8)' : 'rgba(100, 200, 255, 0.5)'}`,
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: game.energy < 20 || game.shieldActive ? 'not-allowed' : 'pointer',
            opacity: game.energy < 20 || game.shieldActive ? 0.5 : 1,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            fontFamily: 'monospace'
          }}
        >
          🛡 护盾 (20能量)
        </button>
      </div>

      {/* Game State Overlays */}
      {gameState === 'ready' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            cursor: 'pointer'
          }}
          onClick={() => game.start()}
          onTouchStart={(e) => {
            e.preventDefault();
            game.start();
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(100, 255, 100, 0.5)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(100, 255, 100, 0.3)',
            pointerEvents: 'none' // 防止子元素触发父元素的点击事件
          }}>
            <h2 style={{
              fontSize: '36px',
              marginBottom: '25px',
              color: 'rgba(100, 255, 100, 1)',
              textShadow: '0 0 20px rgba(100, 255, 100, 0.8)'
            }}>
              光影之线
            </h2>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>🎮 游戏目标</p>
              <p style={{ margin: '4px 0' }}>• 收集光点，增长光束</p>
              <p style={{ margin: '4px 0' }}>• 获得高分，挑战更高等级</p>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>⌨️ 键盘控制</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'rgba(100, 200, 255, 1)', fontFamily: 'monospace' }}>↑↓←→/WASD</span>
                <span>移动光束</span>

                <span style={{ color: 'rgba(100, 200, 255, 1)', fontFamily: 'monospace' }}>Space</span>
                <span>暂停/继续游戏</span>

                <span style={{ color: 'rgba(255, 200, 0, 1)', fontFamily: 'monospace' }}>Shift/1</span>
                <span>加速模式 (30能量)</span>

                <span style={{ color: 'rgba(0, 255, 255, 1)', fontFamily: 'monospace' }}>Ctrl/2</span>
                <span>激活护盾 (20能量)</span>

                <span style={{ color: 'rgba(255, 100, 100, 1)', fontFamily: 'monospace' }}>R</span>
                <span>重新开始 (游戏结束时)</span>

                <span style={{ color: 'rgba(200, 200, 200, 1)', fontFamily: 'monospace' }}>Esc</span>
                <span>暂停游戏</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>🖱️ 鼠标控制</p>
              <p style={{ margin: '4px 0' }}>• 点击画布方向控制移动</p>
              <p style={{ margin: '4px 0' }}>• 右键暂停游戏</p>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>📱 触摸控制</p>
              <p style={{ margin: '4px 0' }}>• 滑动控制方向</p>
              <p style={{ margin: '4px 0' }}>• 双击暂停游戏</p>
            </div>

            <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(100, 255, 100, 0.1)', borderRadius: '10px', border: '1px solid rgba(100, 255, 100, 0.3)' }}>
              <p style={{ fontSize: '16px', margin: '0', color: 'rgba(100, 255, 100, 1)', fontWeight: 'bold' }}>
                🚀 点击任意位置开始游戏
              </p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>
                或按任意方向键开始
              </p>
            </div>
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            cursor: 'pointer'
          }}
          onClick={() => game.pause()}
          onTouchStart={(e) => {
            e.preventDefault();
            game.pause();
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(255, 200, 0, 0.5)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(255, 200, 0, 0.3)',
            pointerEvents: 'none'
          }}>
            <h2 style={{
              fontSize: '32px',
              marginBottom: '20px',
              color: 'rgba(255, 200, 0, 1)',
              textShadow: '0 0 20px rgba(255, 200, 0, 0.8)'
            }}>
              游戏暂停
            </h2>
            <p style={{ fontSize: '16px', margin: '10px 0' }}>点击任意位置继续</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>
              或按空格键继续
            </p>
          </div>
        </div>
      )}

      {gameState === 'game_over' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            cursor: 'pointer'
          }}
          onClick={() => game.restart()}
          onTouchStart={(e) => {
            e.preventDefault();
            game.restart();
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'white',
            padding: '40px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '2px solid rgba(255, 100, 100, 0.5)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(255, 100, 100, 0.3)',
            pointerEvents: 'none'
          }}>
            <h2 style={{
              fontSize: '32px',
              marginBottom: '20px',
              color: 'rgba(255, 100, 100, 1)',
              textShadow: '0 0 20px rgba(255, 100, 100, 0.8)'
            }}>
              游戏结束
            </h2>
            <p style={{ fontSize: '16px', margin: '10px 0' }}>最终得分: {score}</p>
            <p style={{ fontSize: '16px', margin: '10px 0' }}>达到等级: {level}</p>
            <p style={{ fontSize: '16px', margin: '10px 0' }}>点击任意位置重新开始</p>
            <p style={{ fontSize: '14px', margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.7)' }}>
              或按R键重新开始
            </p>
          </div>
        </div>
      )}

      {/* 移动端虚拟控制器 */}
      <div className="mobile-controls">
        <div className="control-pad">
          <button
            className="control-btn up"
            onTouchStart={() => game.setDirection({ x: 0, y: -1 })}
            onMouseDown={() => game.setDirection({ x: 0, y: -1 })}
          >
            ↑
          </button>
          <div className="middle-row">
            <button
              className="control-btn left"
              onTouchStart={() => game.setDirection({ x: -1, y: 0 })}
              onMouseDown={() => game.setDirection({ x: -1, y: 0 })}
            >
              ←
            </button>
            <button
              className="control-btn down"
              onTouchStart={() => game.setDirection({ x: 0, y: 1 })}
              onMouseDown={() => game.setDirection({ x: 0, y: 1 })}
            >
              ↓
            </button>
            <button
              className="control-btn right"
              onTouchStart={() => game.setDirection({ x: 1, y: 0 })}
              onMouseDown={() => game.setDirection({ x: 1, y: 0 })}
            >
              →
            </button>
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="action-btn boost"
            onClick={() => game.activateBoost()}
            disabled={game.energy < 30 || game.boostMode}
          >
            ⚡
          </button>
          <button
            className="action-btn shield"
            onClick={() => game.activateShield()}
            disabled={game.energy < 20 || game.shieldActive}
          >
            🛡
          </button>
          <button
            className="action-btn pause"
            onClick={() => game.pause()}
          >
            暂停
          </button>
          {gameState === 'game_over' && (
            <button
              className="action-btn restart"
              onClick={() => game.restart()}
            >
              重来
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;