export const formatOnlineTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getSessionTypeIcon = (type: string): string => {
  switch (type) {
    case 'game':
      return '🎮';
    case 'voice':
      return '🎤';
    case 'spotify':
      return '🎵';
    default:
      return '📊';
  }
};

export const getPercentileBadgeClass = (percentile: number): string => {
  if (percentile >= 90) return 'bg-yellow-500/20 text-yellow-400';
  if (percentile >= 75) return 'bg-purple-500/20 text-purple-400';
  if (percentile >= 50) return 'bg-blue-500/20 text-blue-400';
  return 'bg-gray-500/20 text-gray-400';
};
