// Chinese captions and clip lengths mirror the original japanese-radio.json;
// stages 2..6 match RADIO_BACKUP in rules.js.
export const RADIO_CAPTIONS: Record<number, string> = {
  2: '各单位注意，发现异常。立即请求支援。',
  3: '封锁城市。立即向本区域增援。',
  4: '军事介入已获批准。所有单位出动。',
  5: '镇压倒计时启动。立即加强封锁线。',
  6: '全面镇压。所有可用单位向目标集结。',
};

export const RADIO_DURATION: Record<number, number> = {
  2: 6.01,
  3: 5.46,
  4: 4.92,
  5: 5.69,
  6: 5.94,
};

export function radioLine(stage: number): string | undefined {
  return Number.isInteger(stage) && stage >= 2 && stage <= 6 ? `radio${stage}` : undefined;
}
