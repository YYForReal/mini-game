// 游戏配置
const INITIAL_SPEED = 3; // 像素每帧
const SPEED_INCREMENT = 0.1;
// const GROWTH_AMOUNT = 5; // 每次增长的像素距离 - 不再使用
// const MAX_PARTICLES = 120; // 减少最大粒子数量 - 使用动态配置
// const GAME_FPS = 60; // 不再使用 - 性能由渲染循环控制
// const FRAME_TIME = 1000 / GAME_FPS; // 不再使用
const TURN_SPEED = 0.15; // 转向速度
const MIN_SEGMENT_DISTANCE = 10; // 最小段间距

// 性能优化配置
const PERFORMANCE_CONFIG = {
  // 根据等级调整粒子数量
  getMaxParticles: (level) => Math.max(60, Math.min(120, 120 - (level - 1) * 10)),
  // 根据等级调整粒子创建频率
  getParticleFrequency: (level) => Math.max(0.3, 1 - (level - 1) * 0.1),
  // 光束段优化
  getMaxBeamLength: (level) => Math.max(30, 50 - (level - 1) * 2),
  // 移动端检测
  isMobile: () => {
    return window.innerWidth <= 767 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  // 移动端性能调整
  getMobilePerformanceFactor: () => {
    return PERFORMANCE_CONFIG.isMobile() ? 0.7 : 1.0;
  },
};

// 角度转换工具
const MathUtils = {
  toRadians: (degrees) => degrees * Math.PI / 180,
  toDegrees: (radians) => radians * 180 / Math.PI,
  normalizeAngle: (angle) => {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
  },
  angleToVector: (angle) => ({
    x: Math.cos(angle),
    y: Math.sin(angle)
  }),
  vectorToAngle: (x, y) => Math.atan2(y, x)
};

// 基础方向（用于兼容性）
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

// 游戏状态
export const GAME_STATES = {
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over'
};

// 光束段类
export class LightBeamSegment {
  constructor(x, y, intensity = 1.0) {
    this.x = x; // 浮点坐标
    this.y = y; // 浮点坐标
    this.intensity = intensity; // 光强度，用于渐变效果
    this.radius = 8 + intensity * 4; // 段的半径
    this.color = this.generateColor();
    this.trail = []; // 轨迹点
    this.maxTrailLength = 5;
  }

  generateColor() {
    // 根据强度生成渐变颜色
    const hue = 200 + Math.sin(this.intensity * Math.PI) * 60;
    const saturation = 70 + this.intensity * 30;
    const lightness = 40 + this.intensity * 30;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  updateIntensity() {
    // 光强度随时间衰减
    this.intensity = Math.max(0.3, this.intensity - 0.01);
    this.radius = 8 + this.intensity * 4;
    this.color = this.generateColor();
  }

  addTrailPoint(x, y) {
    this.trail.push({ x, y, intensity: this.intensity });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  distanceTo(otherSegment) {
    const dx = this.x - otherSegment.x;
    const dy = this.y - otherSegment.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// GitHub物品类
export class GitHubItem {
  constructor(x, y) {
    this.x = x; // 浮点坐标
    this.y = y; // 浮点坐标
    this.type = 'github';
    this.collected = false;
    this.collectAnimation = 0;
    this.baseSize = 15;
    this.pulsePhase = 0;
    this.rotation = 0;
    this.glowIntensity = 0;
    this.glowDirection = 1;
  }

  update() {
    this.pulsePhase += 0.08;
    this.rotation += 0.02;

    // 发光效果动画
    this.glowIntensity += 0.05 * this.glowDirection;
    if (this.glowIntensity >= 1) {
      this.glowIntensity = 1;
      this.glowDirection = -1;
    } else if (this.glowIntensity <= 0.3) {
      this.glowIntensity = 0.3;
      this.glowDirection = 1;
    }

    if (this.collected) {
      this.collectAnimation += 0.15;
    }
  }

  getColor() {
    const intensity = 0.8 + Math.sin(this.pulsePhase) * 0.2;
    return `rgba(255, 255, 255, ${intensity})`;
  }

  getSize() {
    const pulse = Math.sin(this.pulsePhase) * 2;
    return this.collected ?
      this.baseSize * (1 + this.collectAnimation) :
      this.baseSize + pulse;
  }

  render(ctx) {
    ctx.save();

    // 发光效果
    const glowRadius = this.getSize() * 2;
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowRadius
    );
    glowGradient.addColorStop(0, `rgba(100, 200, 255, ${this.glowIntensity * 0.3})`);
    glowGradient.addColorStop(0.5, `rgba(100, 200, 255, ${this.glowIntensity * 0.1})`);
    glowGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 旋转效果
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // 绘制GitHub图标背景
    const bgGradient = ctx.createLinearGradient(-10, -10, 10, 10);
    bgGradient.addColorStop(0, 'rgba(51, 51, 51, 0.9)');
    bgGradient.addColorStop(1, 'rgba(34, 34, 34, 0.9)');

    ctx.fillStyle = bgGradient;
    ctx.strokeStyle = `rgba(100, 200, 255, ${this.glowIntensity})`;
    ctx.lineWidth = 2;

    // 圆角矩形背景
    const size = this.getSize();
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(-size + radius, -size);
    ctx.lineTo(size - radius, -size);
    ctx.arc(size - radius, -size, radius, -Math.PI/2, 0);
    ctx.lineTo(size, size - radius);
    ctx.arc(size - radius, size - radius, radius, 0, Math.PI/2);
    ctx.lineTo(-size + radius, size);
    ctx.arc(-size + radius, size - radius, radius, Math.PI/2, Math.PI);
    ctx.arc(-size + radius, -size + radius, radius, Math.PI, -Math.PI/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制GitHub猫图标（简化版）
    ctx.fillStyle = this.getColor();
    ctx.shadowBlur = 5;
    ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';

    // GitHub猫的头部和耳朵
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, -size * 0.2);
    ctx.lineTo(-size * 0.4, -size * 0.6);
    ctx.lineTo(-size * 0.2, -size * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.6, -size * 0.2);
    ctx.lineTo(size * 0.4, -size * 0.6);
    ctx.lineTo(size * 0.2, -size * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// 光点类
export class LightOrb {
  constructor(x, y, type = 'normal') {
    this.x = x; // 浮点坐标
    this.y = y; // 浮点坐标
    this.type = type;
    this.value = type === 'bonus' ? 5 : 1;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.collected = false;
    this.collectAnimation = 0;
    this.baseSize = type === 'bonus' ? 12 : 8;
  }

  update() {
    this.pulsePhase += 0.1;
    if (this.collected) {
      this.collectAnimation += 0.2;
    }
  }

  getColor() {
    const intensity = Math.max(0, Math.min(1, 0.8 + Math.sin(this.pulsePhase) * 0.2));
    if (this.type === 'bonus') {
      return `rgba(255, 215, 0, ${intensity.toFixed(3)})`;
    }
    return `rgba(100, 200, 255, ${intensity.toFixed(3)})`;
  }

  getSize() {
    const pulse = Math.sin(this.pulsePhase) * 2;
    return this.collected ?
      this.baseSize * (1 + this.collectAnimation) :
      this.baseSize + pulse;
  }
}

// 粒子类
export class Particle {
  constructor(x, y, vx, vy, color, size = 3, type = 'normal') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.originalSize = size;
    this.life = 1.0;
    this.decay = 0.02;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;

    // 性能优化：仅在特定类型时创建轨迹
    this.trail = [];
    this.maxTrailLength = (type === 'trail' || type === 'glow') ? 3 : 0; // 减少轨迹长度

    // 根据类型设置不同属性 - 优化性能
    switch (type) {
      case 'star':
        this.decay = 0.02; // 加快衰减
        this.vx *= 1.3; // 减少速度倍数
        this.vy *= 1.3;
        break;
      case 'spark':
        this.decay = 0.03; // 加快衰减
        this.vx *= 1.8; // 减少速度倍数
        this.vy *= 1.8;
        this.gravity = 0.08; // 减少重力影响
        break;
      case 'glow':
        this.decay = 0.015; // 加快衰减
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.maxTrailLength = 0; // 轨迹型粒子不创建轨迹
        break;
      case 'trail':
        this.decay = 0.04; // 加快衰减
        this.maxTrailLength = 2; // 进一步减少轨迹长度
        break;
      default:
        this.maxTrailLength = 0; // 默认不创建轨迹
    }
  }

  update() {
    // 保存轨迹
    if (this.type === 'trail' && this.trail.length < this.maxTrailLength) {
      this.trail.push({ x: this.x, y: this.y, life: this.life });
    }

    // 基础运动
    this.x += this.vx;
    this.y += this.vy;

    // 重力效果（spark类型）
    if (this.type === 'spark' && this.gravity) {
      this.vy += this.gravity;
    }

    // 空气阻力
    const friction = this.type === 'spark' ? 0.95 : 0.98;
    this.vx *= friction;
    this.vy *= friction;

    // 旋转
    this.rotation += this.rotationSpeed;

    // 脉冲效果（glow类型）
    if (this.type === 'glow') {
      this.pulsePhase += 0.1;
      this.size = this.originalSize * (1 + Math.sin(this.pulsePhase) * 0.3);
    } else {
      this.size *= 0.98;
    }

    // 生命值衰减
    this.life -= this.decay;

    // 更新轨迹
    this.trail = this.trail.filter(point => {
      point.life -= 0.05;
      return point.life > 0;
    });
  }

  isDead() {
    return this.life <= 0;
  }

  render(ctx) {
    // 绘制轨迹
    if (this.type === 'trail' && this.trail.length > 1) {
      ctx.strokeStyle = this.color;
      ctx.lineCap = 'round';

      for (let i = 1; i < this.trail.length; i++) {
        const prev = this.trail[i - 1];
        const curr = this.trail[i];

        ctx.save();
        ctx.globalAlpha = this.life * curr.life * 0.5;
        ctx.lineWidth = this.size * 2 * curr.life;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.save();
    ctx.globalAlpha = this.life;

    switch (this.type) {
      case 'star':
        this.renderStar(ctx);
        break;
      case 'glow':
        this.renderGlow(ctx);
        break;
      default:
        this.renderDefault(ctx);
    }

    ctx.restore();
  }

  renderDefault(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  renderStar(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const spikes = 5;
    const outerRadius = this.size;
    const innerRadius = this.size * 0.5;

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  renderGlow(ctx) {
    // 正确处理颜色透明度
    let baseColor = this.color;

    // 提取RGB值并重新构建带透明度的颜色
    const rgbaMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    const rgbMatch = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    let r, g, b;

    if (rgbaMatch) {
      [, r, g, b] = rgbaMatch;
    } else if (rgbMatch) {
      [, r, g, b] = rgbMatch;
    } else {
      // 如果都不匹配，使用默认颜色
      r = 100; g = 200; b = 255;
    }

    // 多层光晕效果
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.8)`);
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.4)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 30;
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // 核心亮点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 游戏逻辑类
export class LightBeamGame {
  constructor() {
    this.reset();
  }

  reset() {
    // 使用窗口的实际像素尺寸
    this.worldWidth = window.innerWidth;
    this.worldHeight = window.innerHeight;

    // 初始化光束（头部在中心）
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    // 使用浮点坐标创建初始光束 - 增加初始长度避免开始时的自身碰撞
    this.beam = [
      new LightBeamSegment(centerX, centerY, 1.0),
      new LightBeamSegment(centerX - 25, centerY, 0.9),
      new LightBeamSegment(centerX - 50, centerY, 0.8),
      new LightBeamSegment(centerX - 75, centerY, 0.7),
      new LightBeamSegment(centerX - 100, centerY, 0.6)
    ];

    // 改为基于角度的移动系统
    this.angle = 0; // 当前朝向（弧度）
    this.targetAngle = 0; // 目标朝向
    this.velocity = { x: 1, y: 0 }; // 当前速度向量
    this.targetVelocity = { x: 1, y: 0 }; // 目标速度向量

    this.gameState = GAME_STATES.READY;
    this.score = 0;
    this.level = 1;
    this.speed = INITIAL_SPEED;
    this.lastUpdateTime = 0;
    this.frameCount = 0;
    this.gameStartTime = 0; // 游戏开始时间，用于开始时的保护期

    this.orbs = [];
    this.githubItems = [];
    this.particles = [];
    this.backgroundIllumination = 0;

    // 新增系统
    this.energy = 100;
    this.maxEnergy = 100;
    this.boostMode = false;
    this.boostEndTime = 0;
    this.shieldActive = false;
    this.shieldEndTime = 0;
    this.combo = 0;
    this.comboEndTime = 0;
    this.screenShake = 0;

    // 特殊效果
    this.warpPoints = [];
    this.blackHoles = [];
    this.powerUps = [];

    this.generateOrbs();
    this.generateGitHubItem();
  }

  generateOrbs() {
    const orbCount = 3 + Math.floor(this.level / 2);
    this.orbs = [];

    for (let i = 0; i < orbCount; i++) {
      let position;
      let attempts = 0;

      do {
        position = {
          x: 50 + Math.random() * (this.worldWidth - 100), // 留出边界
          y: 50 + Math.random() * (this.worldHeight - 100)
        };
        attempts++;
      } while (this.isPositionOccupied(position.x, position.y) && attempts < 100);

      if (attempts < 100) {
        const type = Math.random() < 0.2 ? 'bonus' : 'normal';
        this.orbs.push(new LightOrb(position.x, position.y, type));
      }
    }
  }

  generateGitHubItem() {
    console.log("navigator.userAgent",navigator.userAgent)
    // 只在PC端生成GitHub物品
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth > 768;

    if (!isDesktop) return;

    // 每隔30秒生成一个GitHub物品，最多同时存在1个
    if (this.githubItems.length > 0) return;

    let position;
    let attempts = 0;

    do {
      position = {
        x: 50 + Math.random() * (this.worldWidth - 100),
        y: 50 + Math.random() * (this.worldHeight - 100)
      };
      attempts++;
    } while (this.isPositionOccupied(position.x, position.y, 50) && attempts < 100);

    if (attempts < 100) {
      this.githubItems.push(new GitHubItem(position.x, position.y));
    }
  }

  isPositionOccupied(x, y, minDistance = 30) {
    // 检查是否与光束冲突（基于距离）
    for (const segment of this.beam) {
      const dx = segment.x - x;
      const dy = segment.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) return true;
    }

    // 检查是否与其他光点冲突
    for (const orb of this.orbs) {
      const dx = orb.x - x;
      const dy = orb.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) return true;
    }

    // 检查是否与GitHub物品冲突
    for (const githubItem of this.githubItems) {
      const dx = githubItem.x - x;
      const dy = githubItem.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) return true;
    }

    return false;
  }

  setDirection(newDirection) {
    // 如果游戏处于准备状态，开始游戏
    if (this.gameState === GAME_STATES.READY) {
      this.start();
    }

    // 将方向向量转换为目标角度
    this.targetAngle = MathUtils.vectorToAngle(newDirection.x, newDirection.y);
    this.targetVelocity = {
      x: newDirection.x,
      y: newDirection.y
    };
  }

  setTargetAngle(angle) {
    // 直接设置目标角度（用于360度控制）
    this.targetAngle = MathUtils.normalizeAngle(angle);
    this.targetVelocity = MathUtils.angleToVector(this.targetAngle);
  }

  update(currentTime) {
    this.frameCount++;

    if (this.gameState !== GAME_STATES.PLAYING) return;

    // 更新特效
    this.updateSpecialEffects(currentTime);

    // 平滑转向 - 逐渐接近目标角度
    const angleDiff = this.targetAngle - this.angle;
    let normalizedDiff = MathUtils.normalizeAngle(angleDiff);
    if (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;

    this.angle += normalizedDiff * TURN_SPEED;
    this.angle = MathUtils.normalizeAngle(this.angle);

    // 更新当前速度向量
    this.velocity = {
      x: Math.cos(this.angle),
      y: Math.sin(this.angle)
    };

    // 计算当前速度
    const currentSpeed = this.boostMode ? this.speed * 2 : this.speed;

    // 安全检查：确保beam数组存在且有头部
    if (!this.beam || this.beam.length === 0 || !this.beam[0]) {
      return;
    }

    // 移动光束头部
    const head = this.beam[0];
    const moveDistance = currentSpeed;
    const newX = head.x + this.velocity.x * moveDistance;
    const newY = head.y + this.velocity.y * moveDistance;

    // 添加轨迹点
    head.addTrailPoint(head.x, head.y);

    // 检查边界碰撞
    // 在移动端，左右边界可以穿越
    const isMobile = PERFORMANCE_CONFIG.isMobile();
    let finalX = newX;
    let finalY = newY;

    if (isMobile) {
      // 移动端：左右边界穿越
      let teleported = false;
      if (newX < 20) {
        finalX = this.worldWidth - 20;
        teleported = true;
      } else if (newX > this.worldWidth - 20) {
        finalX = 20;
        teleported = true;
      }

      // 创建穿越特效
      if (teleported) {
        this.createTeleportEffect(head.x, head.y, finalX, finalY);
      }

      // 上下边界仍然导致游戏结束
      if (newY < 20 || newY > this.worldHeight - 20) {
        if (this.shieldActive) {
          // 护盾激活：反弹而不是游戏结束
          this.shieldActive = false;
          this.shieldEndTime = 0;
          // 创建护盾破碎效果
          this.createShieldBreakEffect(finalX, newY);
          // 反弹角度
          this.angle = MathUtils.normalizeAngle(this.angle + Math.PI);
          this.targetAngle = this.angle;
          return;
        } else {
          this.gameOver();
          return;
        }
      }
    } else {
      // 桌面端：所有边界都导致游戏结束
      if (newX < 20 || newX > this.worldWidth - 20 ||
          newY < 20 || newY > this.worldHeight - 20) {
        if (this.shieldActive) {
          // 护盾激活：反弹而不是游戏结束
          this.shieldActive = false;
          this.shieldEndTime = 0;
          // 创建护盾破碎效果
          this.createShieldBreakEffect(newX, newY);
          // 反弹角度
          this.angle = MathUtils.normalizeAngle(this.angle + Math.PI);
          this.targetAngle = this.angle;
          return;
        } else {
          this.gameOver();
          return;
        }
      }
    }

    const newHead = new LightBeamSegment(finalX, finalY, 1.0);

    // 检查自身碰撞（基于距离）
    // 添加开始保护期：前500ms内不检测自身碰撞
    const hasProtectionPeriod = (Date.now() - this.gameStartTime) < 500;

    for (const segment of this.beam) {
      if (segment === head) continue;
      // 跳过开始的几个段，避免初始碰撞
      const segmentIndex = this.beam.indexOf(segment);
      const isNearHead = segmentIndex < 3; // 前3个段不检测碰撞

      if (!hasProtectionPeriod && !isNearHead && newHead.distanceTo(segment) < MIN_SEGMENT_DISTANCE) {
        if (this.shieldActive) {
          // 护盾激活：反弹而不是游戏结束
          this.shieldActive = false;
          this.shieldEndTime = 0;
          // 创建护盾破碎效果
          this.createShieldBreakEffect(newX, newY);
          // 反弹角度
          this.angle = MathUtils.normalizeAngle(this.angle + Math.PI);
          this.targetAngle = this.angle;
          return;
        } else {
          this.gameOver();
          return;
        }
      }
    }

    this.beam.unshift(newHead);

    // 检查光点收集（基于距离）
    let grew = false;
    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];
      if (!orb.collected && newHead.distanceTo(orb) < 20) { // 收集半径
        orb.collected = true;
        this.score += orb.value + (this.combo > 0 ? this.combo : 0);
        grew = true;

        // 创建收集粒子效果
        this.createCollectParticles(orb.x, orb.y, orb.getColor(), orb.type);

        // 增加背景照明和能量
        this.backgroundIllumination = Math.min(1, this.backgroundIllumination + 0.05);
        this.energy = Math.min(this.maxEnergy, this.energy + (orb.type === 'bonus' ? 10 : 5));
      }
    }

    // 移除已收集的光点
    this.orbs = this.orbs.filter(orb => !orb.collected || orb.collectAnimation < 1);

    // 检查GitHub物品收集（基于距离）
    for (let i = 0; i < this.githubItems.length; i++) {
      const githubItem = this.githubItems[i];
      if (!githubItem.collected && newHead.distanceTo(githubItem) < 25) { // 稍大一点的收集半径
        githubItem.collected = true;

        // 创建特殊的GitHub收集效果
        this.createGitHubCollectEffect(githubItem.x, githubItem.y);

        // 暂停游戏
        this.pause();

        // 延迟跳转到GitHub（让玩家看到收集效果）
        setTimeout(() => {
          window.open('https://github.com/YYForReal/mini-game/tree/main/snake_game', '_blank');
        }, 800);

        break; // 只收集一个
      }
    }

    // 移除已收集的GitHub物品
    this.githubItems = this.githubItems.filter(item => !item.collected || item.collectAnimation < 1);

    // 定期生成GitHub物品（仅在PC端）
    if (this.frameCount % 1800 === 0) { // 每30秒（60fps * 30）
      this.generateGitHubItem();
    }

    // 生成新光点
    if (this.orbs.length === 0) {
      this.generateOrbs();
      this.level++;
      this.speed = Math.max(2, INITIAL_SPEED - this.level * SPEED_INCREMENT);
    }

    // 性能优化：动态光束长度管理
    const maxBeamLength = PERFORMANCE_CONFIG.getMaxBeamLength(this.level);

    if (!grew) {
      // 如果没有收集光点，根据移动距离和等级决定是否缩短
      const distanceFromTail = this.beam.length > 1 ?
        Math.sqrt(
          Math.pow(this.beam[0].x - this.beam[this.beam.length - 1].x, 2) +
          Math.pow(this.beam[0].y - this.beam[this.beam.length - 1].y, 2)
        ) : 0;

      // 根据等级调整最大光束长度
      const maxLength = 200 - (this.level - 1) * 10; // 每级减少10像素
      const actualMaxBeamLength = Math.min(150, maxLength);

      if (distanceFromTail > actualMaxBeamLength || this.beam.length > maxBeamLength) {
        this.beam.pop();
      }
    } else {
      // 收集光点时增长
      const tail = this.beam[this.beam.length - 1];
      // const tailToHead = Math.sqrt( // 不再使用
      //   Math.pow(this.beam[0].x - tail.x, 2) +
      //   Math.pow(this.beam[0].y - tail.y, 2)
      // );

      // 在尾部添加新段
      for (let i = 0; i < 3; i++) {
        const segmentDirection = {
          x: tail.x - (this.beam[this.beam.length - 2]?.x || this.beam[0].x),
          y: tail.y - (this.beam[this.beam.length - 2]?.y || this.beam[0].y)
        };
        const length = Math.sqrt(segmentDirection.x * segmentDirection.x + segmentDirection.y * segmentDirection.y);
        if (length > 0) {
          segmentDirection.x /= length;
          segmentDirection.y /= length;
        }

        const newSegment = new LightBeamSegment(
          tail.x - segmentDirection.x * MIN_SEGMENT_DISTANCE,
          tail.y - segmentDirection.y * MIN_SEGMENT_DISTANCE,
          tail.intensity * 0.9
        );
        this.beam.push(newSegment);
      }
    }

    // 更新光束强度
    this.beam.forEach((segment, index) => {
      segment.intensity = 1.0 - (index / this.beam.length) * 0.5;
      segment.updateIntensity();
    });

    // 更新粒子和光点 - 性能优化
    this.particles = this.particles.filter(particle => {
      particle.update();
      return !particle.isDead();
    });

    // 性能优化：根据等级动态调整粒子数量限制
    const maxParticles = PERFORMANCE_CONFIG.getMaxParticles(this.level);
    if (this.particles.length > maxParticles) {
      // 从最老的粒子开始删除，保留新的
      this.particles = this.particles.slice(-maxParticles);
    }

    this.orbs.forEach(orb => orb.update());
    this.githubItems.forEach(item => item.update());
  }

  createCollectParticles(x, y, color, type = 'normal') {
    // 性能优化：根据等级和设备调整粒子数量
    const frequency = PERFORMANCE_CONFIG.getParticleFrequency(this.level);
    const mobileFactor = PERFORMANCE_CONFIG.getMobilePerformanceFactor();
    const baseParticleCount = type === 'bonus' ? 40 : 25;
    const particleCount = Math.max(6, Math.floor(baseParticleCount * frequency * mobileFactor));

    // 优化：简化粒子类型选择
    const types = ['star', 'spark']; // 移除消耗性能的类型
    const useTrail = this.level <= 2 && Math.random() < 0.2 && !PERFORMANCE_CONFIG.isMobile(); // 移动端不使用轨迹

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.5 + Math.random() * 2.5; // 减少速度范围
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.5 + Math.random() * 2; // 减少尺寸范围
      const particleType = useTrail && Math.random() < 0.2 ? 'trail' : types[Math.floor(Math.random() * types.length)];

      this.particles.push(new Particle(x, y, vx, vy, color, size, particleType));
    }

    // 移动端减少屏幕震动
    this.screenShake = PERFORMANCE_CONFIG.isMobile() ? 1 : 3;

    // 增加连击
    if (type === 'bonus') {
      this.combo++;
      this.comboEndTime = Date.now() + 3000;
      this.score += this.combo * 2; // 连击奖励
    }
  }

  createExplosionParticles(x, y, intense = false) {
    // 性能优化：根据等级调整爆炸粒子数量
    const frequency = PERFORMANCE_CONFIG.getParticleFrequency(this.level);
    const baseParticleCount = intense ? 60 : 30;
    const particleCount = Math.max(10, Math.floor(baseParticleCount * frequency));

    // 简化粒子类型
    const types = ['star', 'spark']; // 只使用性能较好的类型

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * (intense ? 6 : 4); // 减少速度范围
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const hue = Math.random() * 60 + 180; // 蓝色到紫色范围
      const color = `hsl(${hue}, 70%, 50%)`;
      const size = 1.5 + Math.random() * (intense ? 4 : 3); // 减少尺寸范围
      const particleType = types[Math.floor(Math.random() * types.length)];

      this.particles.push(new Particle(x, y, vx, vy, color, size, particleType));
    }

    // 减少屏幕震动
    this.screenShake = intense ? 8 : 4;
  }

  createBoostParticles() {
    if (!this.boostMode) return;

    // 安全检查：确保beam数组存在且有头部
    if (!this.beam || this.beam.length === 0 || !this.beam[0]) return;

    // 安全检查：确保velocity存在
    if (!this.velocity || typeof this.velocity.x !== 'number' || typeof this.velocity.y !== 'number') {
      return;
    }

    const head = this.beam[0];
    const x = head.x;
    const y = head.y;

    // 创建推进器火焰效果
    for (let i = 0; i < 3; i++) {
      const angle = Math.atan2(-this.velocity.y, -this.velocity.x) + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const hue = Math.random() * 60 + 10; // 橙色到黄色范围
      const color = `hsl(${hue}, 100%, 50%)`;
      const size = 3 + Math.random() * 2;

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'spark'));
    }
  }

  createShieldEffect() {
    if (!this.shieldActive) return;

    // 安全检查：确保beam数组存在
    if (!this.beam || this.beam.length === 0) return;

    this.beam.forEach((segment, index) => {
      if (index % 2 === 0) { // 每隔一段创建一个护盾粒子
        const x = segment.x;
        const y = segment.y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const color = 'rgba(0, 255, 255, 0.8)';
        const size = 2;

        this.particles.push(new Particle(x, y, vx, vy, color, size, 'glow'));
      }
    });
  }

  createShieldBreakEffect(x, y) {
    // 创建护盾破碎的粒子效果
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(0, 255, 255, 0.8)';
      const size = 3 + Math.random() * 3;

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'glow'));
    }

    // 屏幕震动
    this.screenShake = 10;

    // 额外的闪光效果
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(255, 255, 255, 1)';
      const size = 2 + Math.random() * 2;

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'star'));
    }
  }

  createGitHubCollectEffect(x, y) {
    // 创建GitHub主题的收集效果

    // 黑色和白色粒子（GitHub主题色）
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const isWhite = Math.random() > 0.5;
      const color = isWhite ? 'rgba(255, 255, 255, 0.9)' : 'rgba(33, 33, 33, 0.9)';
      const size = 2 + Math.random() * 3;

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'star'));
    }

    // 蓝色光环粒子（GitHub的蓝色）
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 2 + Math.random() * 3;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(33, 136, 255, 0.8)';
      const size = 2 + Math.random() * 2;

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'glow'));
    }

    // 代码符号粒子
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(100, 200, 255, 0.7)';
      const size = 1 + Math.random();

      this.particles.push(new Particle(x, y, vx, vy, color, size, 'spark'));
    }

    // 屏幕震动和闪光
    this.screenShake = 15;

    // 创建多层扩散圆环效果
    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          const speed = 3 - ring * 0.5;
          const vx = Math.cos(angle) * speed;
          const vy = Math.sin(angle) * speed;
          const color = `rgba(100, 200, 255, ${0.8 - ring * 0.2})`;
          const size = 2 - ring * 0.5;

          this.particles.push(new Particle(x, y, vx, vy, color, size, 'glow'));
        }
      }, ring * 100);
    }
  }

  createTeleportEffect(fromX, fromY, toX, toY) {
    // 在起点创建消失特效
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(150, 100, 255, 0.8)';
      const size = 2 + Math.random() * 2;

      this.particles.push(new Particle(fromX, fromY, vx, vy, color, size, 'star'));
    }

    // 在终点创建出现特效
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = 'rgba(100, 255, 150, 0.8)';
      const size = 2 + Math.random() * 2;

      this.particles.push(new Particle(toX, toY, vx, vy, color, size, 'glow'));
    }

    // 创建一条连接两边的光线轨迹
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const x = fromX + (toX - fromX) * t;
      const y = fromY + (toY - fromY) * t;
      const color = 'rgba(200, 150, 255, 0.6)';
      const size = 1.5 + Math.random();

      this.particles.push(new Particle(x, y, 0, 0, color, size, 'glow'));
    }
  }

  updateSpecialEffects(currentTime) {
    // 更新连击
    if (this.combo > 0 && currentTime > this.comboEndTime) {
      this.combo = 0;
    }

    // 更新加速模式
    if (this.boostMode && currentTime > this.boostEndTime) {
      this.boostMode = false;
    }

    // 更新护盾
    if (this.shieldActive && currentTime > this.shieldEndTime) {
      this.shieldActive = false;
    }

    // 更新屏幕震动
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.1) this.screenShake = 0;
    }

    // 创建特效
    this.createBoostParticles();
    this.createShieldEffect();

    // 能量恢复
    if (this.energy < this.maxEnergy && this.frameCount % 30 === 0) {
      this.energy = Math.min(this.maxEnergy, this.energy + 1);
    }
  }

  activateBoost() {
    if (this.energy >= 30 && !this.boostMode) {
      this.boostMode = true;
      this.boostEndTime = Date.now() + 5000; // 5秒加速
      this.energy -= 30;
      this.speed *= 0.5; // 速度翻倍
      this.createBoostParticles();
    }
  }

  activateShield() {
    if (this.energy >= 20 && !this.shieldActive) {
      this.shieldActive = true;
      this.shieldEndTime = Date.now() + 8000; // 8秒护盾
      this.energy -= 20;
    }
  }

  start() {
    if (this.gameState === GAME_STATES.READY) {
      this.gameState = GAME_STATES.PLAYING;
      this.gameStartTime = Date.now(); // 记录游戏开始时间
    }
  }

  pause() {
    if (this.gameState === GAME_STATES.PLAYING) {
      this.gameState = GAME_STATES.PAUSED;
    } else if (this.gameState === GAME_STATES.PAUSED) {
      this.gameState = GAME_STATES.PLAYING;
    }
  }

  gameOver() {
    this.gameState = GAME_STATES.GAME_OVER;

    // 创建爆炸效果
    if (this.beam && this.beam.length > 0 && this.beam[0]) {
      const head = this.beam[0];
      this.createExplosionParticles(
        head.x,
        head.y
      );
    }
  }

  restart() {
    this.reset();
  }
}