function today() {
  return new Date()
}

function tomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date
}

export default {
  filters: {
    'heute': {
      after: today(),
      before: tomorrow(),
    },
    'offen': {
      done: false,
    },
    'erledigt': {
      done: true,
    }
  },
  activeByDefault: ['heute', 'offen'],
};
