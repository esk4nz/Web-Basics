const users = [];

function userJoin(id, username, room) {
  const user = { id, username: username.trim(), room: room.trim() };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find(u => u.id === id);
}

function userLeave(id) {
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    return users.splice(idx, 1)[0];
  }
  return null;
}

function getRoomUsers(room) {
  return users.filter(u => u.room === room);
}

module.exports = { userJoin, getCurrentUser, userLeave, getRoomUsers };