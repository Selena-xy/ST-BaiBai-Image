import { describe, expect, it } from 'vitest';

import { requiresNewCharNl } from '@/autoTag/runner';

/**
 * 建档 nl 硬校验的门槛。
 *
 * 回归锁:曾经这道校验只看模型、没看提示词风格 —— anima 风格下规范不强制 nl、
 * 模型也就不给,校验却仍然要求,于是「模型没给 nl」被升级成整次 tag 失败,
 * 症状是 Anima 风格「一直不出提示词」(而原版 NAI 一切正常)。
 */
describe('requiresNewCharNl', () => {
  const base = {
    slot: false,
    backend: 'nai',
    promptStyle: 'nai',
    model: 'nai-diffusion-4-5-full',
  };

  it('真 NAI 4.5/V5:要求建档带 nl', () => {
    expect(requiresNewCharNl(base)).toBe(true);
  });

  it('anima 风格:不要求(该链路不产出 char_captions,硬校验会整次失败)', () => {
    expect(requiresNewCharNl({ ...base, promptStyle: 'anima' })).toBe(false);
  });

  it('单槽重写:不要求(changes 本次会被丢弃)', () => {
    expect(requiresNewCharNl({ ...base, slot: true })).toBe(false);
  });

  it('非 NAI 后端:不要求', () => {
    expect(requiresNewCharNl({ ...base, backend: 'comfyui' })).toBe(false);
  });

  it('不支持 character prompts 的模型:不要求', () => {
    expect(requiresNewCharNl({ ...base, model: 'nai-diffusion-3' })).toBe(false);
  });
});
