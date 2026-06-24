export function accountWord(count) {
  const n = Number(count) || 0;
  return n === 1 ? 'Account' : 'Accounts';
}

export function formatAccountCount(count) {
  const n = Number(count) || 0;
  return `${n} ${accountWord(n)}`;
}
