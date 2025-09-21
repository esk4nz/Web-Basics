function formatTime(date = new Date()) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatMessage(username, text) {
  return {
    username,
    text,
    time: formatTime()
  };
}

module.exports = { formatMessage };