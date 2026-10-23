import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 提示词风格(promptStyle)白名单的存量口径。
 *
 * 白名单是 normalizePromptStyle 唯一的守门员:加 'prose' 那次如果忘了把白名单同步上,
 * 存量与 UI 写入的 'prose' 会被**静默吞成 'nai'** —— 下拉显示选了自然语言风格,
 * 出口却还在按 NAI 原生协议走,这类「面板说 A、实际跑 B」的问题几乎没法从外面排查。
 * (anima 上线时靠的就是同一条链,见 NAI_PROMPT_STYLES / normalizeNai。)
 */

const mocks = vi.hoisted(() => ({
  context: null as Record<string, any> | null,
}));

vi.mock('@/st/context', () => ({
  getContext: () => mocks.context,
}));

async function hydrateWithPromptStyle(promptStyle: unknown) {
  mocks.context = {
    extensionSettings: { baibai_image: { nai: { promptStyle } } },
    saveSettingsDebounced: vi.fn(),
  };
  const { hydrateSettings, settings } = await import('@/state/settings');
  await hydrateSettings();
  return settings;
}

describe('提示词风格白名单', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('toastr', { info: vi.fn(), success: vi.fn(), error: vi.fn() });
    vi.stubGlobal('window', { addEventListener: vi.fn(), dispatchEvent: vi.fn() });
  });

  it('normalizePromptStyle:三个合法值原样通过,其余一律回落 nai', async () => {
    const { normalizePromptStyle } = await import('@/state/settings');
    expect(normalizePromptStyle('nai')).toBe('nai');
    expect(normalizePromptStyle('anima')).toBe('anima');
    expect(normalizePromptStyle('prose')).toBe('prose');
    // 缺字段(存量配置)、脏值:回落 nai = 改动前行为
    expect(normalizePromptStyle(undefined)).toBe('nai');
    expect(normalizePromptStyle(null)).toBe('nai');
    expect(normalizePromptStyle('NlOnly')).toBe('nai');
    expect(normalizePromptStyle('natural')).toBe('nai');
  });

  it('hydrate 后 prose 原样落库,不会被吞成 nai', async () => {
    const settings = await hydrateWithPromptStyle('prose');
    expect(settings.nai.promptStyle).toBe('prose');
  });

  it('下拉选项与白名单一致:每个选项都能被 normalize 原样接受', async () => {
    const { NAI_PROMPT_STYLES, normalizePromptStyle } = await import('@/state/settings');
    expect(NAI_PROMPT_STYLES.map(style => style.value)).toEqual(['nai', 'anima', 'prose']);
    for (const style of NAI_PROMPT_STYLES) {
      expect(normalizePromptStyle(style.value)).toBe(style.value);
    }
  });
});
