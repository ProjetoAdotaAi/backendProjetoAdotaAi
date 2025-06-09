export default (err, req, res, next) => {
  const { code, message } = err;

  if (message) {
    console.error(message);
  }

  res.status(code || 500).json({
    error: message || 'Ocorreu um erro interno no servidor.',
  });
};