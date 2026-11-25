// Sensação do pulo (skill `platformer`): coyote time, buffer, pulo variável,
// gravidade maior na queda e velocidade máxima de queda.
export const MOVE = {
  runSpeed: 240,
  accelGround: 2600, // chega na velocidade máxima em ~0,09 s
  accelAir: 1700, // 0,65x do chão
  gravity: 1500,
  fallGravityExtra: 1100, // queda ~1,7x mais pesada que a subida
  jumpHeight: 125,
  jumpCut: 0.5,
  maxFall: 900,
  coyoteMs: 100,
  bufferMs: 120,
};
