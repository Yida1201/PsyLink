/** Human-verified baseline directory. Country is independent of UI language. */
export type EmergencyResource = { number: string; label: string; source: string; crisis?: boolean };
const euCountries = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
const euSource = 'https://digital-strategy.ec.europa.eu/en/policies/112';
export const emergencyDirectory: Record<string, EmergencyResource[]> = {
  US: [
    {number:'911',label:'紧急救援：警方、消防、急救',source:'https://www.nimh.nih.gov/health/topics/suicide-prevention'},
    {number:'988',label:'心理危机支持：拨打或短信联系，全天可用',source:'https://988lifeline.org/',crisis:true},
  ],
  CN: [
    {number:'120',label:'医疗急救',source:'https://english.beijing.gov.cn/travellinginbeijing/quickguideontravelservices/traveltips/202108/t20210811_2466839.html'},
    {number:'110',label:'警方',source:'https://english.beijing.gov.cn/travellinginbeijing/quickguideontravelservices/traveltips/202108/t20210811_2466839.html'},
    {number:'119',label:'消防',source:'https://english.beijing.gov.cn/travellinginbeijing/quickguideontravelservices/traveltips/202108/t20210811_2466839.html'},
  ],
  JP: [
    {number:'119',label:'消防与医疗急救',source:'https://www.gov.uk/foreign-travel-advice/japan/getting-help'},
    {number:'110',label:'警方',source:'https://www.gov.uk/foreign-travel-advice/japan/getting-help'},
  ],
  KR: [
    {number:'119',label:'消防与医疗急救',source:'https://www.gov.uk/foreign-travel-advice/south-korea/getting-help'},
    {number:'112',label:'警方',source:'https://www.gov.uk/foreign-travel-advice/south-korea/getting-help'},
  ],
  ...Object.fromEntries(euCountries.map(country=>[country,[{number:'112',label:'紧急救援：警方、消防、急救',source:euSource}]])),
};
export const emergencyChecked = '2026-10-10';
export function supportedEmergencyCountry(value: unknown): string | null {
  return typeof value === 'string' && Object.hasOwn(emergencyDirectory,value) ? value : null;
}
// Read only Vercel's coarse country header. Never parse, return or store raw IPs.
export function emergencyCountry(headers: Headers, vercel: boolean): string | null {
  if (!vercel) return null;
  const code = headers.get('x-vercel-ip-country');
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}
