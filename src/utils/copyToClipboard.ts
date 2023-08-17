export async function copyStrToClipboard(str: string) {
  return await navigator.clipboard.writeText(str);
}
